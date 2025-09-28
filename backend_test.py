import requests
import sys
import json
from datetime import datetime

class ManiraAPITester:
    def __init__(self, base_url="https://manira-sparkle.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
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
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "full_name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "9876543210",
            "address": "123 Test Street, Test City",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True, user_data['email']
        return False, None

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@manira.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_user_login(self, email):
        """Test user login"""
        login_data = {
            "email": email,
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_products(self):
        """Test getting products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        return success, response

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success, response

    def test_add_product_admin(self):
        """Test adding product as admin"""
        if not self.admin_token:
            self.log_test("Add Product (Admin)", False, "No admin token available")
            return False, None

        product_data = {
            "name": "Test Diamond Necklace",
            "description": "Beautiful test necklace with American diamonds",
            "price": 5999.99,
            "category": "necklaces",
            "material": "American Diamond",
            "size": "Medium",
            "weight": "15g",
            "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 10
        }
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Add Product (Admin)",
            "POST",
            "admin/products",
            200,
            data=product_data,
            headers=headers
        )
        
        return success, response.get('id') if success else None

    def test_cart_operations(self, product_id):
        """Test cart operations"""
        if not product_id:
            self.log_test("Cart Operations", False, "No product ID available")
            return False

        # Add to cart
        cart_data = {
            "product_id": product_id,
            "quantity": 2
        }
        
        success, _ = self.run_test(
            "Add to Cart",
            "POST",
            "cart/add",
            200,
            data=cart_data
        )
        
        if not success:
            return False

        # Get cart
        success, cart_response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        
        if not success:
            return False

        # Update cart quantity
        update_data = {"quantity": 3}
        success, _ = self.run_test(
            "Update Cart Quantity",
            "PUT",
            f"cart/{product_id}",
            200,
            data=update_data
        )
        
        return success

    def test_order_operations(self):
        """Test order operations"""
        # Get cart first
        success, cart_response = self.run_test(
            "Get Cart for Order",
            "GET",
            "cart",
            200
        )
        
        if not success or not cart_response:
            self.log_test("Create Order", False, "No cart items available")
            return False

        # Create order
        order_data = {
            "items": [
                {
                    "product_id": cart_response[0]['product']['id'],
                    "quantity": 1,
                    "price": cart_response[0]['product']['price']
                }
            ],
            "shipping_address": "123 Test Address, Test City, 123456",
            "phone": "9876543210"
        }
        
        success, order_response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success:
            return False

        # Get user orders
        success, _ = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        
        return success

    def test_admin_orders(self):
        """Test admin order access"""
        if not self.admin_token:
            self.log_test("Get Admin Orders", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, _ = self.run_test(
            "Get Admin Orders",
            "GET",
            "admin/orders",
            200,
            headers=headers
        )
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Manira API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Test basic endpoints (no auth required)
        self.test_get_products()
        self.test_get_categories()

        # Test user registration and login
        reg_success, user_email = self.test_user_registration()
        if reg_success:
            self.test_user_login(user_email)

        # Test admin login
        admin_success = self.test_admin_login()

        # Test admin operations
        product_id = None
        if admin_success:
            add_success, product_id = self.test_add_product_admin()

        # Test cart operations (requires user login)
        if self.token and product_id:
            self.test_cart_operations(product_id)
            self.test_order_operations()

        # Test admin order access
        if admin_success:
            self.test_admin_orders()

        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = ManiraAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())