from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
# Removed passlib import to avoid bcrypt issues
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
security = HTTPBearer()
import hashlib
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="Manira Jewellery API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: str
    full_name: str
    address: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: str
    full_name: str
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # necklaces, rings, earrings, bracelets, etc.
    material: str  # AD, American Diamond, etc.
    size: Optional[str] = None
    weight: Optional[str] = None
    image_url: str
    inventory_count: int = 0
    sku: Optional[str] = None  # SKU for inventory management
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    material: str
    size: Optional[str] = None
    weight: Optional[str] = None
    image_url: str
    inventory_count: int = 0
    sku: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict]  # [{product_id, quantity, price, status: accepted/rejected}]
    total_amount: float
    original_amount: Optional[float] = None  # Store original amount for partial orders
    status: str = "pending"  # pending, review, accepted, partially_accepted, rejected, cancelled, shipped, delivered
    shipping_address: str
    phone: str
    payment_method: str = "UPI"
    payment_status: str = "pending"  # pending, completed, failed
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    items: List[dict]
    shipping_address: str
    phone: str

class CartItem(BaseModel):
    user_id: str
    product_id: str
    quantity: int = 1
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def hash_password(password: str) -> str:
    # Simple SHA256 hash for demo purposes
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user = User(**user_dict)
    
    # Store in database
    user_doc = user.dict()
    user_doc["hashed_password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token(data={"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@api_router.post("/auth/login", response_model=dict)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_doc)
    token = create_access_token(data={"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    filter_dict = {"is_active": True}
    if category:
        filter_dict["category"] = category
    
    products = await db.products.find(filter_dict).to_list(length=100)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin_user: User = Depends(get_admin_user)):
    product = Product(**product_data.dict())
    await db.products.insert_one(product.dict())
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin_user: User = Depends(get_admin_user)):
    product_doc = await db.products.find_one({"id": product_id})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_data = product_data.dict()
    await db.products.update_one({"id": product_id}, {"$set": updated_data})
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

# Cart Routes
@api_router.post("/cart/add")
async def add_to_cart(item: dict, current_user: User = Depends(get_current_user)):
    # Check if product exists
    product = await db.products.find_one({"id": item["product_id"], "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    existing_item = await db.cart.find_one({"user_id": current_user.id, "product_id": item["product_id"]})
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + item.get("quantity", 1)
        await db.cart.update_one(
            {"user_id": current_user.id, "product_id": item["product_id"]},
            {"$set": {"quantity": new_quantity}}
        )
    else:
        # Add new item
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item["product_id"],
            quantity=item.get("quantity", 1)
        )
        await db.cart.insert_one(cart_item.dict())
    
    return {"message": "Item added to cart"}

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user.id}).to_list(length=100)
    
    # Get product details for each cart item
    enriched_cart = []
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]})
        if product:
            enriched_cart.append({
                "product": Product(**product),
                "quantity": item["quantity"]
            })
    
    return enriched_cart

# Additional Cart Routes
@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    result = await db.cart.delete_one({"user_id": current_user.id, "product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{product_id}")
async def update_cart_quantity(product_id: str, quantity_data: dict, current_user: User = Depends(get_current_user)):
    quantity = quantity_data.get("quantity", 1)
    if quantity <= 0:
        return await remove_from_cart(product_id, current_user)
    
    result = await db.cart.update_one(
        {"user_id": current_user.id, "product_id": product_id},
        {"$set": {"quantity": quantity}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    return {"message": "Quantity updated"}

# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Calculate total amount
    total_amount = 0
    for item in order_data.items:
        product = await db.products.find_one({"id": item["product_id"]})
        if product:
            total_amount += product["price"] * item["quantity"]
    
    # Create order
    order = Order(
        user_id=current_user.id,
        items=order_data.items,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        phone=order_data.phone
    )
    
    await db.orders.insert_one(order.dict())
    
    # Clear cart after order
    await db.cart.delete_many({"user_id": current_user.id})
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}).to_list(length=100)
    return [Order(**order) for order in orders]

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin_user: User = Depends(get_admin_user)):
    orders = await db.orders.find().to_list(length=100)
    return [Order(**order) for order in orders]

# Order Management Endpoints
@api_router.put("/admin/orders/{order_id}/review")
async def review_order(order_id: str, review_data: dict, admin_user: User = Depends(get_admin_user)):
    """Admin reviews order - accept fully, partially, or reject"""
    action = review_data.get("action")  # "accept", "partial", "reject"
    items_status = review_data.get("items_status", [])  # [{product_id, status, quantity}]
    admin_notes = review_data.get("admin_notes", "")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["pending", "review"]:
        raise HTTPException(status_code=400, detail="Order cannot be modified in current status")
    
    # Calculate new total for partial orders
    new_total = 0
    updated_items = []
    
    if action == "accept":
        # Accept all items
        for item in order["items"]:
            item["status"] = "accepted"
            updated_items.append(item)
            new_total += item["price"] * item["quantity"]
        new_status = "accepted"
        
    elif action == "partial":
        # Handle partial acceptance
        original_amount = order["total_amount"]
        for item_update in items_status:
            # Find matching item in order
            for item in order["items"]:
                if item["product_id"] == item_update["product_id"]:
                    item["status"] = item_update["status"]
                    if item_update["status"] == "accepted":
                        # Update quantity if provided
                        if "quantity" in item_update:
                            item["quantity"] = item_update["quantity"]
                        new_total += item["price"] * item["quantity"]
                    updated_items.append(item)
                    break
        new_status = "partially_accepted"
        
    elif action == "reject":
        # Reject entire order
        for item in order["items"]:
            item["status"] = "rejected"
            updated_items.append(item)
        new_total = 0
        new_status = "rejected"
    
    # Update order in database
    update_data = {
        "status": new_status,
        "items": updated_items,
        "admin_notes": admin_notes,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if action == "partial":
        update_data["original_amount"] = order["total_amount"]
        update_data["total_amount"] = new_total
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    return {"message": f"Order {action}ed successfully", "new_total": new_total}

@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user)):
    """Customer cancels their order"""
    order = await db.orders.find_one({"id": order_id, "user_id": current_user.id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["pending", "review"]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled in current status")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Order cancelled successfully"}

# User Profile Routes
@api_router.put("/profile")
async def update_profile(profile_data: dict, current_user: User = Depends(get_current_user)):
    """Update user profile"""
    # Extract updatable fields
    update_fields = {}
    if "full_name" in profile_data:
        update_fields["full_name"] = profile_data["full_name"]
    if "phone" in profile_data:
        update_fields["phone"] = profile_data["phone"]
    if "address" in profile_data:
        update_fields["address"] = profile_data["address"]
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user in database
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user data
    updated_user = await db.users.find_one({"id": current_user.id})
    return {"message": "Profile updated successfully", "user": User(**updated_user)}

# Categories endpoint
@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            "necklaces",
            "rings", 
            "earrings",
            "bracelets",
            "pendants",
            "bangles"
        ]
    }

# Admin Category Management
@api_router.get("/admin/categories")
async def get_admin_categories(admin_user: User = Depends(get_admin_user)):
    # Get categories from database or return default ones
    categories = await db.categories.find().to_list(length=100)
    if not categories:
        # Return default categories
        default_categories = ["necklaces", "rings", "earrings", "bracelets", "pendants", "bangles"]
        return {"categories": default_categories}
    
    return {"categories": [cat["name"] for cat in categories]}

@api_router.post("/admin/categories")
async def add_category(category_data: dict, admin_user: User = Depends(get_admin_user)):
    category_name = category_data.get("name", "").lower().strip()
    if not category_name:
        raise HTTPException(status_code=400, detail="Category name is required")
    
    # Check if category already exists
    existing = await db.categories.find_one({"name": category_name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    # Add category
    await db.categories.insert_one({
        "name": category_name,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Category added successfully"}

@api_router.delete("/admin/categories/{category_name}")
async def delete_category(category_name: str, admin_user: User = Depends(get_admin_user)):
    # Check if any products use this category
    products_with_category = await db.products.find({"category": category_name}).to_list(length=1)
    if products_with_category:
        raise HTTPException(status_code=400, detail="Cannot delete category that has products")
    
    result = await db.categories.delete_one({"name": category_name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# Enhanced Product Management
@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()