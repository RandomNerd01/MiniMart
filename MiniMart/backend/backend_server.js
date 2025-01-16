
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const express = require('express');
const app = express();
const fs = require('fs');  // Import fs module to write to files
// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
const { Vonage } = require('@vonage/server-sdk')
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API key
sgMail.setApiKey('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');





// Middleware
app.use(cors());
app.use(bodyParser.json());
const verificationCodes = new Map(); // Temporary storage for verification codes


const nodemailer = require('nodemailer');

// Configure the transporter with your email credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'youremail@gmail.com',
        pass: 'yourpassword' // Use environment variables for security in production
    }
});

let products = [
        { name: "Product 1", price: 10, stock: 10 },
        { name: "Product 2", price: 15, stock: 5 },
        { name: "Product 3", price: 20, stock: 2 }
    ];;




app.put('/admin/products/edit', (req, res) => {
    const { name, price, stock } = req.body;

    if (!name || typeof price !== 'number' || typeof stock !== 'number') {
        return res.status(400).json({ error: 'Invalid product data' });
    }

    const product = products.find(p => p.name === name);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    product.price = price;
    product.stock = stock;

    console.log(`Product updated: ${name}`, product);
    res.status(200).json({ message: 'Product updated successfully', product });
});

let userMobileNumbers = []; // This array will store the username and mobile number.
app.post('/verify-code', (req, res) => {
    const { email, verificationCode } = req.body;
    const correctCode = verificationCodes.get(email);

    if (correctCode === verificationCode) {
        verificationCodes.delete(email);
        res.json({ success: true, message: 'Verification successful. You can now reset your password.' });
    } else {
        res.status(400).json({ success: false, message: 'Incorrect verification code.' });
    }
});

app.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;

    // Find the user in your user data (usersMap or similar data structure)
    const user = usersMap.get(email);

    if (user) {
        // Update the user's password
        user.password = newPassword;
        res.json({ success: true, message: 'Password reset successfully.' });
    } else {
        res.status(404).json({ success: false, message: 'User not found.' });
    }
});

app.post('/send-verification-code', (req, res) => {
    const { email } = req.body;

    // Check if user exists (optional depending on your logic)
    const user = userMobileNumbers.find(u => u.username === email);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found or email not linked.' });
    }

    // Generate a verification code
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    verificationCodes.set(email, code);

    // Send email using SendGrid
    const msg = {
        to: email,
        from: 'lol891930@gmail.com', // Your verified sender email
        subject: 'Your Verification Code for resetting your account in our minimart system',
        text: `Your verification code is: ${code}`,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Verification code sent to ' + email);
            res.json({ success: true, message: 'Verification code sent to your email.' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'Failed to send verification code via email.' });
        });
});
    app.post('/admin/products/remove', (req, res) => {
    const { name } = req.body;

    // Log the received request
    console.log('Received request to remove product:', name);
    console.log('Current products:', products);

    if (!name) {
        console.error('No product name provided');
        return res.status(400).json({ error: 'Product name is required' });
    }

    // Find the product index
    const productIndex = products.findIndex(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (productIndex === -1) {
        console.error(`Product not found: ${name}`);
        return res.status(404).json({ error: 'Product not found' });
    }

    // Remove the product
    const removedProduct = products.splice(productIndex, 1);
    console.log(`Product removed successfully: ${name}`, removedProduct);
    console.log(products);

    return res.status(200).json({ message: 'Product removed successfully', removedProduct });
});

app.post('/save-mobile-number', (req, res) => {
    const { username, mobileNumber } = req.body;
    if (!username || !mobileNumber) {
        return res.status(400).json({ message: 'Username and email are required.' });
    }

    // Save the username and mobile number to the array
    userMobileNumbers.push({ username, mobileNumber });
    console.log(userMobileNumbers);

    res.json({ message: 'Email saved successfully!' });
});
// Mock database using a Map to store user data
const usersMap = new Map(); // Store users with email or Google ID as the key
app.post('/sign-up', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (usersMap.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // Add the new user to usersMap
    usersMap.set(email, {
        verified: true,
        coins: 100,
        transactionHistory: [],
        cart: [],
        password
    });

    console.log(`New user registered: ${email}`);
    res.status(201).json({ message: 'User registered successfully', email });
});

app.post('/sign-in', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = usersMap.get(email);

    if (!user) {
        console.log(`Login attempt failed: User not found (${email})`);
        return res.status(404).json({ error: 'User not found' });
    }

    if (!user.verified) {
        console.log(`Login attempt failed: Account suspended (${email})`);
        return res.status(403).json({ error: 'Account is suspended' });
    }

    if (user.password !== password) {
        console.log(`Login attempt failed: Incorrect password (${email})`);
        return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log(`User signed in: ${email}`);
    res.status(200).json({
        email,
        coins: user.coins,
        transactionHistory: user.transactionHistory,
        cart: user.cart
    });
});


let requestArray = []; // Array to store order requests
app.post('/admin/orders/remove', (req, res) => {
    const { userEmail } = req.body;

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
    }

    // Find the index of the request in the requestArray
    const requestIndex = requestArray.findIndex(req => req.userEmail === userEmail);

    if (requestIndex === -1) {
        return res.status(404).json({ error: 'Request not found' });
    }

    // Remove the request from the array
    const removedRequest = requestArray.splice(requestIndex, 1);
    console.log(`Request removed for user: ${userEmail}`);

    res.status(200).json({ message: 'Request removed successfully', removedRequest });
});

app.post('/admin/orders/process', (req, res) => {
    const { userEmail, action } = req.body;

    if (!userEmail || !action) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    // Find the request for the specified user
    const request = requestArray.find(req => req.userEmail === userEmail && req.status === 'pending');
    if (!request) {
        return res.status(404).json({ error: 'Request not found or already processed' });
    }

    if (action === 'approved') {
        // Deduct user coins
        const user = usersMap.get(userEmail);
        if (user) {
            user.coins -= request.totalCost;

            // Update transaction history
            user.transactionHistory.push(`Purchased ${request.cart.map(item => `${item.quantity}x ${item.product.name}`).join(", ")} for ${request.totalCost} coins.`);

            // Clear user's cart
            user.cart = [];
            console.log(`User ${userEmail}'s order approved. Coins deducted and cart cleared.`);
        }

        // Update product stock
        request.cart.forEach(item => {
            const product = products.find(p => p.name === item.product.name);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        // Update the request status
        request.status = 'approved';
    } else if (action === 'rejected') {
        // If rejected, just update the request status
        request.status = 'rejected';
        console.log(`Request for ${userEmail} was rejected.`);
    }

    res.status(200).json({ message: `Request ${action} successfully`, status: request.status });
});



app.get('/admin/orders', (req, res) => {
    res.json(requestArray);  // Return all pending order requests
});
// Endpoint to handle order requests
app.post('/order-request', (req, res) => {
    const { userEmail, cart, totalCost } = req.body;

    if (!userEmail || !cart || !totalCost) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    // Create the order request
    const orderRequest = {
        userEmail,
        cart,
        totalCost,
        status: 'pending', // Order is pending for approval
        requestDate: new Date()
    };

    // Add the order request to the requestArray
    requestArray.push(orderRequest);

    console.log('New order request added:', orderRequest);

    res.status(201).json({ message: 'Order request submitted successfully', orderRequest });
});

app.delete('/admin/products/:name', (req, res) => {
    const sanitizedName = req.params.name.replace(/-/g, ' '); // Convert dashes back to spaces
    const productIndex = products.findIndex(product => product.name === sanitizedName);

    if (productIndex !== -1) {
        products.splice(productIndex, 1); // Remove the product from the array
        return res.status(200).json({ message: 'Product removed successfully' });
    } else {
        return res.status(404).json({ message: 'Product not found' });
    }
});

app.get('/admin/products', (req, res) => {
    res.status(200).json(products); // Send the current list of products
});

    app.post('/admin/products', (req, res) => {
        const { name, price, stock } = req.body;

        // Validate inputs
        if (!name || typeof price !== 'number' || typeof stock !== 'number') {
            return res.status(400).json({ error: 'Invalid product data' });
        }

        // Add the new product to the array
        const newProduct = { name, price, stock };
        products.push(newProduct);

        console.log('New product added:', newProduct);
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    });


app.get('/admin/users', (req, res) => {
    try {
        // Convert usersMap to an array of user objects with email and verified status
        const users = Array.from(usersMap.entries()).map(([email, data]) => ({
            email,
            verified: data.verified
        }));

        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/admin/users/unsuspend', (req, res) => {
    const { email } = req.body;

    if (!email || !usersMap.has(email)) {
        return res.status(404).json({ error: 'User not found' });
    }

    const user = usersMap.get(email);
    user.verified = true; // Mark the user as verified
    usersMap.set(email, user); // Update the user in the Map

    res.status(200).json({ message: `User ${email} unsuspended successfully` });
});

app.post('/admin/users/suspend', (req, res) => {
    const { email } = req.body;

    if (!email || !usersMap.has(email)) {
        return res.status(404).json({ error: 'User not found' });
    }

    const user = usersMap.get(email);
    user.verified = false; // Mark the user as suspended
    usersMap.set(email, user); // Update the user in the Map

    res.status(200).json({ message: `User ${email} suspended successfully` });
});


// Middleware
app.get('/api/products', (req, res) => {
    
    res.json(products);
});
function logStockUpdate(productName, newStock) {
    const currentTimeUTC = new Date().toISOString();  // Current timestamp in ISO format (UTC)
    const localTime = new Date().toLocaleString();  // Convert to local time string

    const logMessage = `[${localTime}] Admin updated ${productName} to stock ${newStock}\n`;

    fs.appendFile('update_log.txt', logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log('Log written to update_log.txt');
        }
    });
}
function logUser(userName, productName, newStock) {
    const currentTimeUTC = new Date().toISOString();  // Current timestamp in ISO format (UTC)
    const localTime = new Date().toLocaleString();  // Convert to local time string

    const logMessage = `[${localTime}] User ${userName} requested ${newStock} of ${productName} \n`;

    fs.appendFile('update_log_user.txt', logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log('Log written to update_log.txt');
        }
    });
}
app.put('/api/products/:name', (req, res) => {
    const productName = req.params.name.replace(/-/g, ' '); // Convert dashes back to spaces
    const newStock = req.body.stock;

    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    if (product) {
        product.stock = newStock; // Update stock value
        res.status(200).json({ message: 'Stock updated', product });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Mock backend to update stock
app.post('/api/update-stock', (req, res) => {
    // Destructure the parameters from the request body
    const { productName, newStock, username } = req.body;

    // Find the product in your products list
    let product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());

    if (product) {
        if(newStock>0){
            logUser(username, productName, product.stock - newStock);
        }
        

        // Update the product's stock value
        product.stock = newStock;

        // Send a success response back to the client
        res.status(200).json({ success: true, product });
    } else {
        // If product is not found, send a 404 error
        res.status(404).json({ error: 'Product not found' });
    }
});

// Default route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint to verify user
app.post('/verify-user', (req, res) => {
    
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (usersMap.has(email)) {
	
        return res.status(200).json({ message: 'User already verified' });
    }

    // Send verification email
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Account Verification',
        text: `Welcome! Your account has been verified for the Minimart System.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        // Mark user as verified in the mock database
        usersMap.set(email, { verified: true, coins: 100, transactionHistory: [], cart: [] });
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Verification email sent' });
    });
});

app.get('/user-data', (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    let user = usersMap.get(email);

    if (!user) {
        console.log(`User not found: ${email}. Adding to usersMap.`);
        user = { coins: 100, transactionHistory: [], verified: true, cart: [] };
        usersMap.set(email, user);
    } else if (!user.verified) {
        console.log(`Account suspended for: ${email}`);
        return res.status(403).json({ error: 'Account is suspended' });
    }

    res.status(200).json({
        email,
        coins: user.coins,
        transactionHistory: user.transactionHistory,
        cart: user.cart
    });
});



// Endpoint to update cart
app.post('/update-cart', (req, res) => {
    const { email, item } = req.body;
    if (usersMap.has(email)) {
        const user = usersMap.get(email);
        user.cart.push(item);
        res.status(200).json({ message: 'Cart updated successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});
// Endpoint to place a preorder
app.post('/api/preorder', (req, res) => {
    const { email, productName, quantity } = req.body;

    // Check if the product exists
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the quantity requested is valid
    if (quantity <= 0 || quantity > product.stock) {
        return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if the user exists
    if (!usersMap.has(email)) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = usersMap.get(email);
    
    // Deduct coins for preorder
    const totalCost = product.price * quantity;
    if (user.coins < totalCost) {
        return res.status(400).json({ message: 'Not enough coins' });
    }
    
    // Deduct coins from the user
    user.coins -= totalCost;

    // Place the preorder (store it in the user's data)
    user.cart.push({ product: productName, quantity, status: 'preordered' });

    // Save the user data after update
    usersMap.set(email, user);

    res.status(200).json({ message: 'Preorder placed successfully', product: productName, quantity });
});



// Endpoint to update transaction history
app.post('/update-transaction', (req, res) => {
    console.log("Are u here in upodate transaction");
    const { email, transactionDetails } = req.body;
        
        const user = usersMap.get(email);
        user.transactionHistory.push(transactionDetails);
        let productName = transactionDetails.name;  // Access 'name' property
        let productStock = transactionDetails.stock;  // Access 'stock' property
        
        res.status(200).json({ message: 'Transaction history updated successfully' });
 
});


// Submit an order (this is where users place their orders)
app.post('/submit-order', (req, res) => {
    console.log("Are u here in submit order");
    const { customerName, product, quantity, amount } = req.body;

    // Check if the product exists and if there is enough stock
    const productData = products.find(p => p.productName === product);
    if (!productData) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (productData.stock < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock' });
    }

    // Deduct stock from the product
    productData.stock -= quantity;
    
    logUser(customerName, product, quantity);
    // Create the order and add it to the orders list
    const order = { customerName, product, quantity, amount };
    orders.push(order);

    // Log the action (Order placed and stock updated)
    logAction(`Order placed by ${customerName} for ${quantity} of ${product}. Amount: ${amount}.`);
    logAction(`Updated stock for ${product} to ${productData.stock}.`);

    res.json({ success: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
