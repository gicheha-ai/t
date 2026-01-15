// mongo-init.js
db = db.getSiblingDB('predictions_db');

// Create collections
db.createCollection('users');
db.createCollection('predictions');
db.createCollection('payments');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.predictions.createIndex({ user: 1, accessedAt: -1 });
db.predictions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.payments.createIndex({ user: 1, createdAt: -1 });
db.payments.createIndex({ transactionId: 1 }, { unique: true, sparse: true });

// Insert initial admin user (optional)
db.users.insertOne({
  username: 'admin',
  email: 'admin@predictionspro.com',
  password: '$2a$10$YourHashedPasswordHere', // Use bcrypt hash in production
  phone: '254721810516',
  role: 'admin',
  freePredictionsUsed: 0,
  balance: 1000,
  createdAt: new Date(),
  verified: true
});

print('MongoDB initialized successfully');