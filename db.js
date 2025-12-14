// Database helper functions

// Get user reference
function getUserRef() {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return database.ref(`users/${user.uid}`);
}

// Get clients reference (shared across all users)
function getClientsRef() {
  return database.ref('clients');
}

// Get products reference (shared across all users)
function getProductsRef() {
  return database.ref('products');
}

// Get orders reference (shared across all users)
function getOrdersRef() {
  return database.ref('orders');
}

// Get client by ID
function getClient(clientId) {
  return getClientsRef().child(clientId).once('value');
}

// Get product by ID
function getProduct(productId) {
  return getProductsRef().child(productId).once('value');
}

// Get order by ID
function getOrder(orderId) {
  return getOrdersRef().child(orderId).once('value');
}

// Create client
function createClient(clientData) {
  return getClientsRef().push(clientData);
}

// Update client
function updateClient(clientId, clientData) {
  return getClientsRef().child(clientId).update(clientData);
}

// Delete client
function deleteClient(clientId) {
  return getClientsRef().child(clientId).remove();
}

// Create product
function createProduct(productData) {
  return getProductsRef().push(productData);
}

// Update product
function updateProduct(productId, productData) {
  return getProductsRef().child(productId).update(productData);
}

// Delete product
function deleteProduct(productId) {
  return getProductsRef().child(productId).remove();
}

// Create order
function createOrder(orderData) {
  return getOrdersRef().push(orderData);
}

// Update order
function updateOrder(orderId, orderData) {
  return getOrdersRef().child(orderId).update(orderData);
}

// Delete order
function deleteOrder(orderId) {
  return getOrdersRef().child(orderId).remove();
}

