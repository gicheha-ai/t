FROM mongo:6

# Create initialization script
RUN echo "db.createUser({ \
  user: 'predictions_user', \
  pwd: '\${MONGO_PASSWORD}', \
  roles: [{ \
    role: 'readWrite', \
    db: 'predictions_db' \
  }] \
})" > /docker-entrypoint-initdb.d/init-mongo.js

EXPOSE 27017

CMD ["mongod", "--bind_ip_all"]