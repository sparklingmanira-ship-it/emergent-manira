import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def make_user_admin():
    """Make the admin user an admin"""
    result = await db.users.update_one(
        {"email": "admin@manira.com"},
        {"$set": {"is_admin": True}}
    )
    if result.modified_count > 0:
        print("✅ Made admin@manira.com an admin user")
    else:
        print("❌ Admin user not found or already admin")

async def create_manira_products():
    """Create Manira products using the user's uploaded images"""
    
    # Clear existing products first
    await db.products.delete_many({})
    
    manira_products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Royal Crown Ring",
            "description": "Exquisite American Diamond ring featuring a magnificent crown design with intricate detailing. A masterpiece that embodies royal elegance and contemporary style.",
            "price": 22999.0,
            "category": "rings",
            "material": "American Diamond, Premium Silver",
            "size": "Adjustable (6-8)",
            "weight": "15g",
            "image_url": "https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/tp5jz4ds_IMG_6633.jpeg",
            "inventory_count": 12,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Starflower Ring",
            "description": "Stunning star-shaped American Diamond ring with radiating petals of brilliance. Perfect for making a statement at special occasions.",
            "price": 18999.0,
            "category": "rings",
            "material": "American Diamond, 18K White Gold Plated",
            "size": "Free Size (adjustable)",
            "weight": "12g",
            "image_url": "https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/b167u5fl_IMG_6638.jpeg",
            "inventory_count": 18,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Celestial Ring",
            "description": "Breathtaking American Diamond ring with celestial-inspired design. Features brilliant cut stones arranged in a mesmerizing pattern.",
            "price": 25999.0,
            "category": "rings",
            "material": "American Diamond, Platinum Plated Silver",
            "size": "6, 7, 8 (specify at checkout)",
            "weight": "18g",
            "image_url": "https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/cjc9nvd2_IMG_6639.jpeg",
            "inventory_count": 10,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Bloom Cluster Ring",
            "description": "Elegant American Diamond ring featuring a beautiful floral cluster design. Each stone carefully positioned to create maximum brilliance.",
            "price": 16999.0,
            "category": "rings",
            "material": "American Diamond, Sterling Silver",
            "size": "Adjustable (5-7)",
            "weight": "10g",
            "image_url": "https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/5pkyhqan_IMG_6640.jpeg",
            "inventory_count": 25,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Sunburst Pendant Ring",
            "description": "Magnificent American Diamond ring with sunburst design featuring a radiant center stone surrounded by brilliant accents.",
            "price": 21999.0,
            "category": "rings", 
            "material": "American Diamond, Rose Gold Plated",
            "size": "Universal (6-8)",
            "weight": "14g",
            "image_url": "https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/k59u3pec_IMG_6641.jpeg",
            "inventory_count": 15,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        # Additional products with the beautiful jewelry images from earlier
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Classic Necklace",
            "description": "Timeless American Diamond necklace perfect for everyday elegance. Features carefully selected stones in a contemporary setting.",
            "price": 15999.0,
            "category": "necklaces",
            "material": "American Diamond, Sterling Silver",
            "size": "18 inches",
            "weight": "25g",
            "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 30,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Diamond Studs",
            "description": "Classic American Diamond stud earrings that add the perfect touch of sophistication to any outfit.",
            "price": 8999.0,
            "category": "earrings",
            "material": "American Diamond, White Gold Plated",
            "size": "8mm diameter",
            "weight": "6g",
            "image_url": "https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 40,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manira Elegance Bracelet",
            "description": "Sophisticated American Diamond bracelet featuring a delicate chain design with sparkling accents.",
            "price": 12999.0,
            "category": "bracelets",
            "material": "American Diamond, Rose Gold Plated",
            "size": "7.5 inches (adjustable)",
            "weight": "15g",
            "image_url": "https://images.unsplash.com/photo-1684439673104-f5d22791c71a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyOHww&ixlib=rb-4.1.0&q=85",
            "inventory_count": 22,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.products.insert_many(manira_products)
    print(f"✅ Created {len(manira_products)} Manira products")

async def main():
    """Main function to set up Manira data"""
    print("Setting up Manira Jewellery data...")
    
    await make_user_admin()
    await create_manira_products()
    
    print("✅ Manira data setup completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())