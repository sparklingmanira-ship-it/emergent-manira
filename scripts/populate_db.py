import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # Simple hash for demo purposes - truncate password if needed
    password_bytes = password.encode('utf-8')[:72]  # bcrypt limitation
    return pwd_context.hash(password_bytes)

async def create_admin_user():
    """Create an admin user"""
    admin_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@manira.com",
        "hashed_password": hash_password("admin123"),
        "phone": "+91 9876543210",
        "full_name": "Manira Admin",
        "address": "Manira Headquarters, Mumbai, India",
        "is_admin": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@manira.com"})
    if not existing_admin:
        await db.users.insert_one(admin_data)
        print("Admin user created: admin@manira.com / admin123")
    else:
        print("Admin user already exists")

async def create_sample_products():
    """Create sample products"""
    
    # Clear existing products first
    await db.products.delete_many({})
    
    sample_products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Elegant Diamond Necklace",
            "description": "A stunning American Diamond necklace featuring brilliant cut stones in a contemporary setting. Perfect for special occasions and formal events.",
            "price": 15999.0,
            "category": "necklaces",
            "material": "American Diamond, Sterling Silver",
            "size": "18 inches",
            "weight": "25g",
            "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 25,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Classic Diamond Ring",
            "description": "Timeless American Diamond ring with a solitaire design. Crafted with precision for everyday elegance and special moments.",
            "price": 8999.0,
            "category": "rings",
            "material": "American Diamond, 18K Gold Plated",
            "size": "Adjustable (6-8)",
            "weight": "8g",
            "image_url": "https://images.unsplash.com/photo-1607703829739-c05b7beddf60?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 30,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sparkling Diamond Earrings",
            "description": "Exquisite American Diamond stud earrings that add the perfect touch of glamour. Ideal for both casual and formal wear.",
            "price": 5999.0,
            "category": "earrings",
            "material": "American Diamond, Sterling Silver",
            "size": "1.2 cm diameter",
            "weight": "6g",
            "image_url": "https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 40,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Designer Diamond Bracelet",
            "description": "Contemporary American Diamond bracelet featuring an intricate chain design. A statement piece that complements any outfit.",
            "price": 12999.0,
            "category": "bracelets",
            "material": "American Diamond, Rose Gold Plated",
            "size": "7.5 inches (adjustable)",
            "weight": "15g",
            "image_url": "https://images.unsplash.com/photo-1684439673104-f5d22791c71a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyOHww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 20,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Royal Diamond Pendant",
            "description": "Magnificent American Diamond pendant with intricate detailing. Features a classic design that never goes out of style.",
            "price": 7999.0,
            "category": "pendants",
            "material": "American Diamond, White Gold Plated",
            "size": "2.5 cm x 1.8 cm",
            "weight": "10g",
            "image_url": "https://images.pexels.com/photos/14264358/pexels-photo-14264358.jpeg",
            "inventory_count": 35,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Traditional Diamond Bangles",
            "description": "Set of 2 traditional American Diamond bangles with ethnic patterns. Perfect for festivals and traditional occasions.",
            "price": 18999.0,
            "category": "bangles",
            "material": "American Diamond, Gold Plated Brass",
            "size": "2.6 inch diameter",
            "weight": "40g (pair)",
            "image_url": "https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg",
            "inventory_count": 15,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Delicate Diamond Chain",
            "description": "Minimalist American Diamond chain necklace for everyday wear. Subtle elegance that pairs beautifully with any outfit.",
            "price": 4999.0,
            "category": "necklaces",
            "material": "American Diamond, Sterling Silver",
            "size": "16 inches",
            "weight": "8g",
            "image_url": "https://images.unsplash.com/photo-1716366193038-495a3702fe22?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 50,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vintage Style Diamond Ring",
            "description": "Vintage-inspired American Diamond ring with intricate metalwork. A unique piece for those who appreciate classic designs.",
            "price": 11999.0,
            "category": "rings",
            "material": "American Diamond, Antique Gold Plated",
            "size": "Free Size (adjustable)",
            "weight": "12g",
            "image_url": "https://images.unsplash.com/photo-1721206625226-c064ff8d92a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyOHww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 22,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.products.insert_many(sample_products)
    print(f"Created {len(sample_products)} sample products")

async def main():
    """Main function to populate database"""
    print("Populating Manira Jewellery Database...")
    
    await create_admin_user()
    await create_sample_products()
    
    print("Database population completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())