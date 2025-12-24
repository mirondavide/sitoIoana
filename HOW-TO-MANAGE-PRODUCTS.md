# How to Manage Products - Simple Guide

This website has been simplified so you only need to edit **ONE FILE** to manage all products.

## The Only File You Need to Edit: `products.json`

All products are stored in the file called `products.json` in the main folder.

---

## How to Add a New Product

1. Open the `products.json` file
2. Copy one of the existing product blocks (everything between `{` and `}`)
3. Paste it at the end of the list (before the last `]`)
4. Change the values:
   - **id**: Give it a unique number (like "10", "11", etc.)
   - **name**: The product name
   - **price**: The price (without the euro symbol, like "99.00")
   - **image**: Path to the product image (put the image in the `img` folder first)
   - **categories**: Choose from: "bimbo", "bimba", "asilo", "cucina", "regalo", "borse", "decorazioni", "regali-nascita"
   - **featured**: Set to `true` to show in "I più amati" section, or `false` for regular products
   - **description**: Short description of the product

### Example:
```json
{
  "id": "10",
  "name": "Nuovo Zaino",
  "price": "79.00",
  "image": "img/nuovo-zaino.png",
  "categories": ["bimbo", "asilo"],
  "featured": false,
  "description": "Zaino spazioso per la scuola"
}
```

**IMPORTANT**: Don't forget to add a comma `,` after the previous product!

---

## How to Edit an Existing Product

1. Open the `products.json` file
2. Find the product you want to edit (search for its name)
3. Change the values you want (name, price, image, etc.)
4. Save the file

---

## How to Delete a Product

1. Open the `products.json` file
2. Find the product you want to delete
3. Delete the entire block from `{` to `}` (including the comma after it if there is one)
4. Save the file

---

## How to Add Product Images

1. Put your image file in the `img` folder
2. In `products.json`, set the image path like this: `"image": "img/your-image-name.png"`

---

## Available Categories

You can use these categories (you can use multiple categories for one product):

- **bimbo** - For boys
- **bimba** - For girls
- **asilo** - Nursery items
- **cucina** - Kitchen items
- **regalo** - Gifts
- **borse** - Bags
- **decorazioni** - Decorations
- **regali-nascita** - Birth gifts

---

## Featured Products

Products with `"featured": true` will appear in the "I più amati" (Most Loved) section on the homepage with a "Bestseller" badge.

Regular products have `"featured": false` and appear in the main products section.

---

## Important Tips

1. **Always use double quotes** `"` around text values
2. **Don't forget commas** between products
3. **The last product** in the list should NOT have a comma after it
4. **ID numbers** must be unique - no two products can have the same ID
5. **Test your changes** by opening the website in a browser after saving

---

## JSON Format Rules

The file must follow this structure:

```json
{
  "products": [
    {
      "id": "1",
      "name": "Product Name",
      ...
    },
    {
      "id": "2",
      "name": "Another Product",
      ...
    }
  ]
}
```

- Start with `{` and `"products": [`
- Each product is inside `{ }`
- Products are separated by commas
- End with `]` and `}`

---

## Need Help?

If the website doesn't work after your changes:

1. Check if you forgot a comma or quote
2. Make sure all `{` have matching `}`
3. Make sure all `[` have matching `]`
4. You can use an online JSON validator to check if your file is correct

---

## That's It!

You now know everything you need to manage products. Just edit `products.json` and refresh your website to see the changes.
