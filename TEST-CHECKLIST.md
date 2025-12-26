# End-to-End Manual Test Checklist

## Prerequisites
- [ ] Netlify site deployed and live
- [ ] Netlify Identity enabled with at least one invited user
- [ ] Git Gateway enabled in Netlify
- [ ] Environment variables set in Netlify:
  - [ ] CLOUDINARY_CLOUD_NAME
  - [ ] CLOUDINARY_API_KEY
  - [ ] CLOUDINARY_API_SECRET
  - [ ] GITHUB_TOKEN
  - [ ] GITHUB_REPO (format: owner/repo)
  - [ ] GITHUB_BRANCH (optional, defaults to main)
- [ ] Have at least one test image ready (JPEG/PNG/WebP, under 5MB)

---

## Test 1: Authentication Flow

### 1.1 Unauthenticated Access
- [ ] Open browser to `https://your-site.netlify.app/admin`
- [ ] Verify Netlify Identity login modal appears automatically
- [ ] Verify cannot see admin form without logging in

### 1.2 Login
- [ ] Enter email and password
- [ ] Click "Log in"
- [ ] Verify modal closes
- [ ] Verify admin form is now visible
- [ ] Verify logout button appears in top-right

### 1.3 Logout
- [ ] Click "Logout" button
- [ ] Verify redirected to /index.html
- [ ] Navigate back to /admin
- [ ] Verify login modal appears again

---

## Test 2: Form Validation (Client-Side)

### 2.1 Empty Form Submission
- [ ] Login to admin panel
- [ ] Click "Aggiungi Prodotto" without filling anything
- [ ] Verify HTML5 validation prevents submission (browser shows "Please fill out this field")

### 2.2 Product Name Validation
- [ ] Enter name: "AB" (only 2 characters)
- [ ] Fill other required fields minimally
- [ ] Submit form
- [ ] Verify alert: "Il nome del prodotto deve avere almeno 3 caratteri"

### 2.3 Price Format Validation
- [ ] Enter price: "18" (no decimals)
- [ ] Fill other fields
- [ ] Submit form
- [ ] Verify alert: "Il prezzo deve essere nel formato: 18.00"

- [ ] Enter price: "18.5" (one decimal)
- [ ] Submit form
- [ ] Verify alert: "Il prezzo deve essere nel formato: 18.00"

- [ ] Enter price: "18.00" (correct)
- [ ] Verify no price validation error

### 2.4 Description Validation
- [ ] Enter description: "Too short" (9 characters)
- [ ] Fill other fields
- [ ] Submit form
- [ ] Verify alert: "La descrizione deve avere almeno 10 caratteri"

### 2.5 Category Validation
- [ ] Uncheck all category checkboxes
- [ ] Fill other fields
- [ ] Submit form
- [ ] Verify alert: "Seleziona almeno una categoria"

### 2.6 Image Validation
- [ ] Do not select any images
- [ ] Fill other fields with valid data
- [ ] Submit form
- [ ] Verify alert: "Devi caricare almeno un'immagine"

---

## Test 3: Image Upload Flow

### 3.1 Single Image Upload
- [ ] Click "Immagini" file input
- [ ] Select one valid image (JPEG/PNG, under 5MB)
- [ ] Verify image preview appears below file input
- [ ] Verify preview shows thumbnail of selected image
- [ ] Verify "×" remove button appears on preview

### 3.2 Multiple Image Upload
- [ ] Click "Immagini" file input
- [ ] Select 3 images
- [ ] Verify all 3 previews appear
- [ ] Verify each has a remove button

### 3.3 Remove Image
- [ ] With multiple images selected
- [ ] Click "×" on second image preview
- [ ] Verify that preview is removed
- [ ] Verify other images remain

### 3.4 Large Image Rejection
- [ ] Prepare an image larger than 5MB (or use browser dev tools to simulate)
- [ ] Select the large image
- [ ] Verify alert appears: "Errore: L'immagine [filename] supera 5MB"
- [ ] Verify image is not added to preview

---

## Test 4: Successful Product Addition

### 4.1 Fill Valid Product Form
- [ ] Enter name: "Test Product 1"
- [ ] Enter price: "25.00"
- [ ] Enter description: "This is a test product with valid description length."
- [ ] Check categories: "Asilo" and "Bimba"
- [ ] Leave "Prodotto in evidenza" unchecked
- [ ] Upload 1 valid image
- [ ] Enter Altezza: "30cm"
- [ ] Enter Larghezza: "20cm"

### 4.2 Submit Form
- [ ] Click "Aggiungi Prodotto"
- [ ] Verify button shows spinner: "Caricamento..."
- [ ] Verify button is disabled during submission
- [ ] Verify upload progress bar appears
- [ ] Verify progress text: "Caricamento immagine 1 di 1..."
- [ ] Wait for completion

### 4.3 Success Response
- [ ] Verify green success alert appears at top
- [ ] Verify message: "Prodotto aggiunto con successo! Il sito si aggiornerà automaticamente in 30-60 secondi."
- [ ] Verify form is reset (all fields empty)
- [ ] Verify image previews cleared
- [ ] Verify button re-enabled: "Aggiungi Prodotto"

### 4.4 Verify GitHub Commit
- [ ] Open GitHub repository: https://github.com/mirondavide/sitoIoana
- [ ] Go to commits page
- [ ] Verify latest commit message: "Add product: Test Product 1 (via admin panel)"
- [ ] Click on commit
- [ ] Verify products.json was modified
- [ ] Verify new product appears at end of products array
- [ ] Verify product has correct fields: id, name, price, images (Cloudinary URL), categories, featured, description, specs

### 4.5 Verify Netlify Rebuild
- [ ] Go to Netlify dashboard > Deploys
- [ ] Verify new deploy triggered automatically (within 10 seconds)
- [ ] Wait for deploy to complete (~30-60 seconds)
- [ ] Verify deploy status: "Published"

### 4.6 Verify Product on Site
- [ ] Navigate to `https://your-site.netlify.app/`
- [ ] Scroll to "Tutti i nostri prodotti" section
- [ ] Verify "Test Product 1" appears in the list
- [ ] Verify image loads correctly (from Cloudinary URL)
- [ ] Verify price shows: "€25.00"

- [ ] Navigate to `https://your-site.netlify.app/shop.html?category=asilo`
- [ ] Verify "Test Product 1" appears in Asilo category

- [ ] Click on product card
- [ ] Verify redirected to product detail page
- [ ] Verify all details display correctly

---

## Test 5: Featured Product

### 5.1 Add Featured Product
- [ ] Login to admin
- [ ] Fill form with valid data
- [ ] Enter name: "Featured Test Product"
- [ ] Check "Prodotto in evidenza"
- [ ] Upload image
- [ ] Submit form
- [ ] Verify success

### 5.2 Verify Featured Badge
- [ ] Wait for site rebuild
- [ ] Navigate to homepage
- [ ] Verify "Featured Test Product" appears in "I più amati" section
- [ ] Verify product card has "Bestseller" badge

---

## Test 6: Multiple Images

### 6.1 Add Product with 3 Images
- [ ] Login to admin
- [ ] Fill form with valid data
- [ ] Upload 3 different images
- [ ] Verify all 3 previews show
- [ ] Submit form
- [ ] Verify success

### 6.2 Verify Multiple Images Upload
- [ ] Check GitHub commit
- [ ] Verify product.images array has 3 Cloudinary URLs
- [ ] Each URL should be different

### 6.3 Verify on Product Page
- [ ] Navigate to product detail page
- [ ] Verify image carousel/gallery shows all 3 images
- [ ] Verify can navigate between images

---

## Test 7: Error Handling

### 7.1 Network Error (Offline)
- [ ] Login to admin
- [ ] Fill valid form with image
- [ ] Open browser DevTools > Network tab
- [ ] Set network to "Offline"
- [ ] Submit form
- [ ] Verify error alert appears
- [ ] Verify error message mentions network/connection
- [ ] Set network back to "Online"

### 7.2 Invalid Cloudinary Credentials
- [ ] In Netlify, temporarily change CLOUDINARY_API_KEY to invalid value
- [ ] Trigger new deploy
- [ ] Login to admin
- [ ] Fill form and upload image
- [ ] Submit form
- [ ] Verify error alert: "Cloudinary authentication failed - check API credentials"
- [ ] Restore correct CLOUDINARY_API_KEY
- [ ] Redeploy

### 7.3 Invalid GitHub Token
- [ ] In Netlify, temporarily change GITHUB_TOKEN to invalid value
- [ ] Trigger new deploy
- [ ] Login to admin
- [ ] Fill form and upload image
- [ ] Submit form (images upload successfully)
- [ ] Verify error alert mentions GitHub authentication
- [ ] Restore correct GITHUB_TOKEN
- [ ] Redeploy

### 7.4 Missing Environment Variable
- [ ] In Netlify, temporarily delete CLOUDINARY_CLOUD_NAME
- [ ] Trigger new deploy
- [ ] Login to admin
- [ ] Fill form and upload image
- [ ] Submit form
- [ ] Verify error: "Server misconfigured: missing CLOUDINARY_CLOUD_NAME"
- [ ] Restore CLOUDINARY_CLOUD_NAME
- [ ] Redeploy

### 7.5 Session Expiry
- [ ] Login to admin
- [ ] Open browser DevTools > Application/Storage > Local Storage
- [ ] Delete all Netlify Identity related keys
- [ ] Fill form
- [ ] Submit form
- [ ] Verify error: "Sessione scaduta. Effettua di nuovo il login."

---

## Test 8: Console Logs (Debugging)

### 8.1 Check Function Logs in Netlify
- [ ] Go to Netlify dashboard > Functions
- [ ] Click on "upload-image"
- [ ] Verify recent logs show:
  - [ ] Request ID (e.g., `[abc123]`)
  - [ ] Authentication status
  - [ ] Image upload details (filename, size)
  - [ ] Success or error details

- [ ] Click on "save-product"
- [ ] Verify logs show:
  - [ ] Request ID
  - [ ] Authenticated user email
  - [ ] GitHub config
  - [ ] Validation passed
  - [ ] Commit successful

### 8.2 Check Browser Console
- [ ] Open browser DevTools > Console
- [ ] Fill and submit valid form
- [ ] Verify no JavaScript errors
- [ ] Verify console.log for "Saving product:" appears
- [ ] On error, verify detailed error logged

---

## Test 9: Edge Cases

### 9.1 Empty Products.json
- [ ] Manually edit products.json to be: `{"products":[]}`
- [ ] Commit to GitHub
- [ ] Login to admin
- [ ] Add product
- [ ] Verify product ID = "1"
- [ ] Verify success

### 9.2 Concurrent Edits (Conflict)
- [ ] Open admin in two browser tabs
- [ ] Fill form in Tab 1, don't submit yet
- [ ] Fill form in Tab 2, submit immediately
- [ ] Wait for Tab 2 success
- [ ] Now submit Tab 1
- [ ] Verify error: "Conflitto: products.json è stato modificato. Ricarica la pagina e riprova."
- [ ] Refresh Tab 1
- [ ] Resubmit
- [ ] Verify success

### 9.3 Special Characters in Product Name
- [ ] Enter name: "Test àèéìòù Product <>&"
- [ ] Fill other fields
- [ ] Submit
- [ ] Verify success
- [ ] Check GitHub commit
- [ ] Verify special characters preserved correctly in JSON

### 9.4 Very Long Description
- [ ] Enter description with 500+ characters
- [ ] Submit
- [ ] Verify success
- [ ] Check product page
- [ ] Verify entire description displays

---

## Test 10: Cross-Browser Testing

### 10.1 Chrome/Edge
- [ ] Run Tests 4-7 in Chrome
- [ ] Verify all pass

### 10.2 Firefox
- [ ] Run Tests 4-7 in Firefox
- [ ] Verify all pass

### 10.3 Safari (if available)
- [ ] Run Tests 4-7 in Safari
- [ ] Verify all pass

### 10.4 Mobile Browser
- [ ] Open admin on mobile device
- [ ] Login
- [ ] Verify form is responsive
- [ ] Fill form using mobile keyboard
- [ ] Upload image from mobile camera/gallery
- [ ] Submit
- [ ] Verify success

---

## Test 11: Payload Verification

### 11.1 Check Upload-Image Payload
- [ ] Open DevTools > Network tab
- [ ] Upload image
- [ ] Find request to `upload-image`
- [ ] Click > Payload tab
- [ ] Verify payload contains:
  - [ ] `image`: base64 data URI string
  - [ ] `filename`: string
- [ ] Verify headers contain:
  - [ ] `Authorization: Bearer [token]`
  - [ ] `Content-Type: application/json`

### 11.2 Check Save-Product Payload
- [ ] In Network tab
- [ ] Find request to `save-product`
- [ ] Click > Payload tab
- [ ] Verify payload contains exactly:
  - [ ] `id`: string
  - [ ] `name`: string
  - [ ] `price`: string (format: "XX.XX")
  - [ ] `images`: array of strings
  - [ ] `categories`: array of strings
  - [ ] `featured`: boolean
  - [ ] `description`: string
  - [ ] `specs`: object (may be empty)
- [ ] Verify NO extra fields sent
- [ ] Verify Authorization header present

---

## Final Verification

- [ ] All 11 test sections completed
- [ ] All critical paths pass
- [ ] Function logs show proper debugging info
- [ ] No JavaScript errors in browser console
- [ ] Products display correctly on live site
- [ ] GitHub commits show proper messages and author info

---

## Notes
- Record any failures with screenshot and browser console output
- Check Netlify Function logs for server-side errors
- Verify products.json is valid JSON after each test
- If any test fails, check environment variables first
