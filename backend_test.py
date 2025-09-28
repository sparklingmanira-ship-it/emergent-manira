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
                if data:
                    response = requests.delete(url, json=data, headers=test_headers)
                else:
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
        success, response = self.run_test(
            "Get Admin Orders",
            "GET",
            "admin/orders",
            200,
            headers=headers
        )
        
        return success, response

    def test_settings_api(self):
        """Test Settings API endpoints"""
        if not self.admin_token:
            self.log_test("Settings API Tests", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test GET settings
        success, settings_response = self.run_test(
            "GET Admin Settings",
            "GET",
            "admin/settings",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        # Verify settings structure and no ObjectId serialization errors
        expected_fields = ['store_name', 'store_email', 'store_phone', 'store_address', 'currency']
        for field in expected_fields:
            if field not in settings_response:
                self.log_test(f"Settings Field Check ({field})", False, f"Missing field: {field}")
                return False
        
        self.log_test("Settings Structure Check", True, "All expected fields present")
        
        # Test PUT settings - update some settings
        updated_settings = {
            "store_name": "Updated Manira Jewellery",
            "store_email": "updated@manira.com",
            "store_phone": "+91 9999999999",
            "store_address": "Updated Address, Mumbai",
            "currency": "INR",
            "free_shipping_threshold": 3000,
            "standard_shipping_cost": 150
        }
        
        success, _ = self.run_test(
            "PUT Admin Settings",
            "PUT",
            "admin/settings",
            200,
            data=updated_settings,
            headers=headers
        )
        
        if not success:
            return False
        
        # Verify settings persistence - GET again to check if changes were saved
        success, updated_response = self.run_test(
            "GET Updated Settings (Persistence Check)",
            "GET",
            "admin/settings",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        # Check if the updates were persisted
        persistence_check = True
        for key, value in updated_settings.items():
            if updated_response.get(key) != value:
                self.log_test(f"Settings Persistence ({key})", False, f"Expected: {value}, Got: {updated_response.get(key)}")
                persistence_check = False
        
        if persistence_check:
            self.log_test("Settings Persistence Check", True, "All settings persisted correctly")
        
        return persistence_check

    def test_orders_delete_functionality(self):
        """Test Orders Delete functionality"""
        if not self.admin_token:
            self.log_test("Orders Delete Tests", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get existing orders first
        success, orders_response = self.run_test(
            "Get Orders for Delete Test",
            "GET",
            "admin/orders",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        initial_order_count = len(orders_response)
        print(f"  📊 Found {initial_order_count} orders initially")
        
        # If no orders exist, create some test orders first
        if initial_order_count == 0:
            print("  🔧 Creating test orders for deletion testing...")
            
            # First create a test user
            test_user_data = {
                "full_name": "Test User for Orders",
                "email": f"order_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "phone": "9876543210",
                "address": "123 Test Address",
                "password": "testpass123"
            }
            
            success, reg_response = self.run_test(
                "Create Test User for Orders",
                "POST",
                "auth/register",
                200,
                data=test_user_data
            )
            
            if not success:
                self.log_test("Orders Delete Test", False, "Could not create test user for orders")
                return False
            
            user_token = reg_response['access_token']
            user_headers = {'Authorization': f'Bearer {user_token}', 'Content-Type': 'application/json'}
            
            # Create some test products first
            test_product_data = {
                "name": "Test Product for Order Deletion",
                "description": "Test product for order deletion testing",
                "price": 999.99,
                "category": "rings",
                "material": "Test Material",
                "image_url": "https://example.com/test.jpg",
                "inventory_count": 10
            }
            
            success, product_response = self.run_test(
                "Create Test Product for Orders",
                "POST",
                "admin/products",
                200,
                data=test_product_data,
                headers=headers
            )
            
            if not success:
                self.log_test("Orders Delete Test", False, "Could not create test product")
                return False
            
            product_id = product_response['id']
            
            # Create test orders
            for i in range(3):
                order_data = {
                    "items": [
                        {
                            "product_id": product_id,
                            "quantity": 1,
                            "price": 999.99
                        }
                    ],
                    "shipping_address": f"Test Address {i+1}",
                    "phone": "9876543210"
                }
                
                success, _ = self.run_test(
                    f"Create Test Order {i+1}",
                    "POST",
                    "orders",
                    200,
                    data=order_data,
                    headers=user_headers
                )
                
                if not success:
                    print(f"  ⚠️ Failed to create test order {i+1}")
            
            # Get orders again after creation
            success, orders_response = self.run_test(
                "Get Orders After Creation",
                "GET",
                "admin/orders",
                200,
                headers=headers
            )
            
            if not success:
                return False
            
            initial_order_count = len(orders_response)
            print(f"  📊 Created {initial_order_count} test orders")
        
        if initial_order_count == 0:
            self.log_test("Orders Delete Test", False, "No orders available to test deletion")
            return False
        
        # Test individual order deletion
        if initial_order_count > 0:
            order_to_delete = orders_response[0]['id']
            print(f"  🗑️ Deleting individual order: {order_to_delete}")
            
            success, _ = self.run_test(
                "DELETE Individual Order",
                "DELETE",
                f"admin/orders/{order_to_delete}",
                200,
                headers=headers
            )
            
            if not success:
                return False
            
            # Verify order was actually deleted
            success, updated_orders = self.run_test(
                "Verify Order Deletion",
                "GET",
                "admin/orders",
                200,
                headers=headers
            )
            
            if success:
                deleted_order_exists = any(order['id'] == order_to_delete for order in updated_orders)
                if deleted_order_exists:
                    self.log_test("Order Deletion Verification", False, "Order still exists after deletion")
                    return False
                else:
                    self.log_test("Order Deletion Verification", True, "Order successfully removed from database")
        
        # Test bulk order deletion if we have multiple orders remaining
        success, fresh_orders = self.run_test(
            "Get Fresh Orders for Bulk Delete",
            "GET",
            "admin/orders",
            200,
            headers=headers
        )
        
        if success:
            remaining_count = len(fresh_orders)
            print(f"  📊 Found {remaining_count} orders remaining for bulk test")
            
            if remaining_count >= 2:
                bulk_order_ids = [fresh_orders[0]['id'], fresh_orders[1]['id']]
                print(f"  🗑️ Bulk deleting orders: {bulk_order_ids}")
                
                success, bulk_response = self.run_test(
                    "DELETE Bulk Orders",
                    "DELETE",
                    "admin/orders/bulk",
                    200,
                    data={"order_ids": bulk_order_ids},
                    headers=headers
                )
                
                if success:
                    print(f"  ✅ Bulk delete response: {bulk_response}")
                    # Verify bulk deletion worked
                    success, final_orders = self.run_test(
                        "Verify Bulk Order Deletion",
                        "GET",
                        "admin/orders",
                        200,
                        headers=headers
                    )
                    
                    if success:
                        remaining_deleted_orders = [order['id'] for order in final_orders if order['id'] in bulk_order_ids]
                        if remaining_deleted_orders:
                            self.log_test("Bulk Order Deletion Verification", False, f"Orders still exist: {remaining_deleted_orders}")
                            return False
                        else:
                            self.log_test("Bulk Order Deletion Verification", True, "All bulk orders successfully removed")
                else:
                    print(f"  ❌ Bulk delete failed")
            else:
                self.log_test("Bulk Orders Delete Test", False, f"Not enough orders remaining ({remaining_count}) for bulk test")
        
        # Test error handling - try to delete non-existent order
        fake_order_id = "non-existent-order-id"
        success, _ = self.run_test(
            "DELETE Non-existent Order (Error Handling)",
            "DELETE",
            f"admin/orders/{fake_order_id}",
            404,
            headers=headers
        )
        
        return True

    def test_customers_delete_functionality(self):
        """Test Customers Delete functionality"""
        if not self.admin_token:
            self.log_test("Customers Delete Tests", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # First, create a test user for deletion testing
        test_user_data = {
            "full_name": "Test Customer for Deletion",
            "email": f"delete_test_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "9876543210",
            "address": "123 Test Address for Deletion",
            "password": "testpass123"
        }
        
        success, reg_response = self.run_test(
            "Create Test Customer for Deletion",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not success:
            self.log_test("Customers Delete Test", False, "Could not create test customer")
            return False
        
        test_customer_id = reg_response['user']['id']
        print(f"  👤 Created test customer: {test_customer_id}")
        
        # Create another test user for cascade deletion test
        test_user_data2 = {
            "full_name": "Test Customer 2 for Cascade Deletion",
            "email": f"cascade_test_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "9876543211",
            "address": "456 Test Address for Cascade",
            "password": "testpass123"
        }
        
        success, reg_response2 = self.run_test(
            "Create Test Customer 2 for Cascade Deletion",
            "POST",
            "auth/register",
            200,
            data=test_user_data2
        )
        
        test_customer_id2 = reg_response2['user']['id'] if success else None
        
        # Get existing customers to verify our test customers are there
        success, customers_response = self.run_test(
            "Get Customers for Delete Test",
            "GET",
            "admin/customers",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        # Test customer-only deletion (delete_orders=false)
        success, _ = self.run_test(
            "DELETE Customer Only (delete_orders=false)",
            "DELETE",
            f"admin/customers/{test_customer_id}?delete_orders=false",
            200,
            headers=headers
        )
        
        if not success:
            return False
        
        # Verify customer was deleted
        success, updated_customers = self.run_test(
            "Verify Customer Deletion",
            "GET",
            "admin/customers",
            200,
            headers=headers
        )
        
        if success:
            deleted_customer_exists = any(customer['id'] == test_customer_id for customer in updated_customers)
            if deleted_customer_exists:
                self.log_test("Customer Deletion Verification", False, "Customer still exists after deletion")
                return False
            else:
                self.log_test("Customer Deletion Verification", True, "Customer successfully removed")
        
        # Test customer+orders deletion (delete_orders=true) if we have another customer
        if test_customer_id2:
            success, cascade_response = self.run_test(
                "DELETE Customer with Orders (delete_orders=true)",
                "DELETE",
                f"admin/customers/{test_customer_id2}?delete_orders=true",
                200,
                headers=headers
            )
            
            if success:
                self.log_test("Customer Cascade Deletion", True, "Customer and orders deletion completed")
        
        # Test admin protection - try to delete admin user
        admin_customers = [customer for customer in customers_response if customer.get('is_admin', False)]
        if admin_customers:
            admin_id = admin_customers[0]['id']
            
            success, _ = self.run_test(
                "DELETE Admin User (Should Fail)",
                "DELETE",
                f"admin/customers/{admin_id}",
                404,  # Should fail with 404 or 403
                headers=headers
            )
            
            # This test passes if it fails to delete admin
            if success:
                self.log_test("Admin Protection Test", True, "Admin user deletion properly blocked")
        
        # Test error handling - try to delete non-existent customer
        fake_customer_id = "non-existent-customer-id"
        success, _ = self.run_test(
            "DELETE Non-existent Customer (Error Handling)",
            "DELETE",
            f"admin/customers/{fake_customer_id}",
            404,
            headers=headers
        )
        
        return True

    def test_authentication_failures(self):
        """Test authentication failures for protected endpoints"""
        # Test without token
        success, _ = self.run_test(
            "Settings Access Without Auth",
            "GET",
            "admin/settings",
            403,  # FastAPI returns 403 for missing auth
            headers={}
        )
        
        # Test with invalid token
        invalid_headers = {'Authorization': 'Bearer invalid-token-here'}
        success, _ = self.run_test(
            "Settings Access With Invalid Token",
            "GET",
            "admin/settings",
            401,
            headers=invalid_headers
        )
        
        # Test orders delete without auth
        success, _ = self.run_test(
            "Orders Delete Without Auth",
            "DELETE",
            "admin/orders/fake-id",
            403,  # FastAPI returns 403 for missing auth
            headers={}
        )
        
        # Test customers delete without auth
        success, _ = self.run_test(
            "Customers Delete Without Auth",
            "DELETE",
            "admin/customers/fake-id",
            403,  # FastAPI returns 403 for missing auth
            headers={}
        )
        
        return True

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

    def run_focused_tests(self):
        """Run focused tests for Settings, Orders Delete, and Customers Delete"""
        print("🎯 Starting Focused API Tests for Settings & Delete Functionality...")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)

        # Test admin login first
        admin_success = self.test_admin_login()
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with admin tests")
            return 1

        print("\n🔧 Testing Settings API...")
        self.test_settings_api()

        print("\n🗑️ Testing Orders Delete Functionality...")
        self.test_orders_delete_functionality()

        print("\n👥 Testing Customers Delete Functionality...")
        self.test_customers_delete_functionality()

        print("\n🔒 Testing Authentication Failures...")
        self.test_authentication_failures()

        # Print results
        print("\n" + "=" * 70)
        print(f"📊 Focused Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All focused tests passed!")
            return 0
        else:
            print("❌ Some focused tests failed!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = ManiraAPITester()
    # Run focused tests for the specific features mentioned in the review request
    return tester.run_focused_tests()

if __name__ == "__main__":
    sys.exit(main())