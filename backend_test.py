#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class StockMarketAPITester:
    def __init__(self, base_url="https://marketai-102.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200)

    def test_auth_flow(self):
        """Test authentication flow"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Generate unique test user
        timestamp = int(time.time())
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"
        
        # Test user registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, register_data)
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   📝 Registered user: {test_email}")
        else:
            print("   ❌ Registration failed - cannot continue with auth tests")
            return False
        
        # Test login with same credentials
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if success and 'token' in response:
            self.token = response['token']  # Update token
            print(f"   📝 Login successful")
        
        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        return True

    def test_stock_endpoints(self):
        """Test stock-related endpoints"""
        print("\n🔍 Testing Stock Endpoints...")
        
        # Test stock search
        self.run_test("Stock Search", "GET", "stocks/search?q=RELIANCE", 200)
        
        # Test get stock details
        self.run_test("Get Stock Details", "GET", "stocks/RELIANCE?period=1y", 200)
        
        # Test stock prediction (single timeframe)
        self.run_test("Stock Prediction (30d)", "GET", "stocks/RELIANCE/predict?days=30", 200)
        
        # Test multi-timeframe predictions
        self.run_test("Multi-timeframe Predictions", "GET", "stocks/RELIANCE/predictions", 200)
        
        # Test trending stocks
        self.run_test("Trending Stocks", "GET", "market/trending", 200)

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n🔍 Testing Dashboard Endpoints...")
        
        # Test dashboard summary
        self.run_test("Dashboard Summary", "GET", "dashboard/summary", 200)
        
        # Test dashboard predictions
        self.run_test("Dashboard Predictions", "GET", "dashboard/predictions", 200)

    def test_portfolio_flow(self):
        """Test portfolio management flow"""
        print("\n🔍 Testing Portfolio Management...")
        
        # Test get empty portfolio
        self.run_test("Get Portfolio (Empty)", "GET", "portfolio", 200)
        
        # Test add stock to portfolio
        portfolio_data = {
            "symbol": "TCS",
            "quantity": 10,
            "buy_price": 3500.00,
            "buy_date": "2024-01-15"
        }
        
        success, response = self.run_test("Add to Portfolio", "POST", "portfolio/add", 200, portfolio_data)
        
        portfolio_item_id = None
        if success and 'id' in response:
            portfolio_item_id = response['id']
            print(f"   📝 Added TCS to portfolio with ID: {portfolio_item_id}")
        
        # Test get portfolio with items
        self.run_test("Get Portfolio (With Items)", "GET", "portfolio", 200)
        
        # Test remove from portfolio
        if portfolio_item_id:
            self.run_test("Remove from Portfolio", "DELETE", f"portfolio/{portfolio_item_id}", 200)

    def test_alerts_flow(self):
        """Test alerts management flow"""
        print("\n🔍 Testing Alerts Management...")
        
        # Test get empty alerts
        self.run_test("Get Alerts (Empty)", "GET", "alerts", 200)
        
        # Test create alert
        alert_data = {
            "symbol": "INFY",
            "alert_type": "price_above",
            "threshold": 1500.00,
            "email_enabled": True
        }
        
        success, response = self.run_test("Create Alert", "POST", "alerts", 200, alert_data)
        
        alert_id = None
        if success and 'id' in response:
            alert_id = response['id']
            print(f"   📝 Created alert with ID: {alert_id}")
        
        # Test get alerts with items
        self.run_test("Get Alerts (With Items)", "GET", "alerts", 200)
        
        # Test toggle alert
        if alert_id:
            self.run_test("Toggle Alert", "PATCH", f"alerts/{alert_id}/toggle", 200)
        
        # Test delete alert
        if alert_id:
            self.run_test("Delete Alert", "DELETE", f"alerts/{alert_id}", 200)

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid stock symbol
        self.run_test("Invalid Stock Symbol", "GET", "stocks/INVALID123", 404)
        
        # Test unauthorized access (without token)
        temp_token = self.token
        self.token = None
        self.run_test("Unauthorized Access", "GET", "portfolio", 401)
        self.token = temp_token
        
        # Test invalid prediction days
        self.run_test("Invalid Prediction Days", "GET", "stocks/RELIANCE/predict?days=999", 400)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Stock Market API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        
        start_time = time.time()
        
        # Run test suites
        self.test_health_endpoints()
        
        if self.test_auth_flow():
            self.test_stock_endpoints()
            self.test_dashboard_endpoints()
            self.test_portfolio_flow()
            self.test_alerts_flow()
        
        self.test_error_handling()
        
        # Print summary
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"   Duration: {duration:.2f}s")
        
        # Return success if all critical tests pass
        critical_failures = self.tests_run - self.tests_passed
        return critical_failures == 0

def main():
    """Main test execution"""
    tester = StockMarketAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        results = {
            "summary": {
                "total_tests": tester.tests_run,
                "passed": tester.tests_passed,
                "failed": tester.tests_run - tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "tests": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }
        
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/test_reports/backend_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())