const dbConnection = require('../connection');
const logger = require('../../utils/logger');
const { DatabaseError, NotFoundError } = require('../../utils/errors');

/**
 * Base Repository Class
 * Provides common CRUD operations for all repositories
 * All specific repositories should extend this class
 */
class BaseRepository {
  /**
   * @param {string} collectionName - Name of the MongoDB collection
   */
  constructor(collectionName) {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }
    this.collectionName = collectionName;
  }

  /**
   * Get the MongoDB collection
   * @returns {Promise<Collection>}
   */
  async getCollection() {
    try {
      return await dbConnection.getCollection(this.collectionName);
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get collection',
        collection: this.collectionName
      });
      throw new DatabaseError(`Failed to access collection: ${this.collectionName}`);
    }
  }

  /**
   * Find documents matching query
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options (projection, sort, limit, skip)
   * @returns {Promise<Array>}
   */
  async find(query = {}, options = {}) {
    try {
      const collection = await this.getCollection();
      const { projection, sort, limit, skip } = options;

      let cursor = collection.find(query);

      if (projection) cursor = cursor.project(projection);
      if (sort) cursor = cursor.sort(sort);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);

      const results = await cursor.toArray();

      logger.db('find', this.collectionName, {
        queryKeys: Object.keys(query),
        resultCount: results.length,
        options
      });

      return results;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Find operation failed',
        collection: this.collectionName,
        query
      });
      throw new DatabaseError(`Find operation failed: ${error.message}`);
    }
  }

  /**
   * Find a single document
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findOne(query = {}, options = {}) {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne(query, options);

      logger.db('findOne', this.collectionName, {
        queryKeys: Object.keys(query),
        found: !!result
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'FindOne operation failed',
        collection: this.collectionName,
        query
      });
      throw new DatabaseError(`FindOne operation failed: ${error.message}`);
    }
  }

  /**
   * Find a document by ID
   * @param {string|ObjectId} id - Document ID
   * @returns {Promise<Object>}
   * @throws {NotFoundError} if document not found
   */
  async findById(id) {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ _id: id });

      if (!result) {
        throw new NotFoundError(`Document not found with id: ${id}`);
      }

      logger.db('findById', this.collectionName, { id, found: true });
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.errorWithContext(error, {
        context: 'FindById operation failed',
        collection: this.collectionName,
        id
      });
      throw new DatabaseError(`FindById operation failed: ${error.message}`);
    }
  }

  /**
   * Count documents matching query
   * @param {Object} query - MongoDB query
   * @returns {Promise<number>}
   */
  async count(query = {}) {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(query);

      logger.db('count', this.collectionName, {
        queryKeys: Object.keys(query),
        count
      });

      return count;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Count operation failed',
        collection: this.collectionName,
        query
      });
      throw new DatabaseError(`Count operation failed: ${error.message}`);
    }
  }

  /**
   * Execute aggregation pipeline
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>}
   */
  async aggregate(pipeline = [], options = {}) {
    try {
      const collection = await this.getCollection();
      const results = await collection.aggregate(pipeline, options).toArray();

      logger.db('aggregate', this.collectionName, {
        pipelineStages: pipeline.length,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Aggregation operation failed',
        collection: this.collectionName,
        pipelineLength: pipeline.length
      });
      throw new DatabaseError(`Aggregation operation failed: ${error.message}`);
    }
  }

  /**
   * Find distinct values for a field
   * @param {string} field - Field name
   * @param {Object} query - MongoDB query
   * @returns {Promise<Array>}
   */
  async distinct(field, query = {}) {
    try {
      const collection = await this.getCollection();
      const results = await collection.distinct(field, query);

      logger.db('distinct', this.collectionName, {
        field,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Distinct operation failed',
        collection: this.collectionName,
        field
      });
      throw new DatabaseError(`Distinct operation failed: ${error.message}`);
    }
  }

  /**
   * Insert a single document
   * @param {Object} document - Document to insert
   * @returns {Promise<Object>} Inserted document with _id
   */
  async insertOne(document) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne(document);

      logger.db('insertOne', this.collectionName, {
        insertedId: result.insertedId
      });

      return { ...document, _id: result.insertedId };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'InsertOne operation failed',
        collection: this.collectionName
      });
      throw new DatabaseError(`InsertOne operation failed: ${error.message}`);
    }
  }

  /**
   * Insert multiple documents
   * @param {Array} documents - Documents to insert
   * @returns {Promise<Array>} Inserted documents with _ids
   */
  async insertMany(documents) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertMany(documents);

      logger.db('insertMany', this.collectionName, {
        insertedCount: result.insertedCount
      });

      return documents.map((doc, index) => ({
        ...doc,
        _id: result.insertedIds[index]
      }));
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'InsertMany operation failed',
        collection: this.collectionName,
        documentCount: documents.length
      });
      throw new DatabaseError(`InsertMany operation failed: ${error.message}`);
    }
  }

  /**
   * Update a single document
   * @param {Object} query - Query to find document
   * @param {Object} update - Update operations
   * @returns {Promise<Object>} Update result
   */
  async updateOne(query, update) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(query, update);

      logger.db('updateOne', this.collectionName, {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'UpdateOne operation failed',
        collection: this.collectionName
      });
      throw new DatabaseError(`UpdateOne operation failed: ${error.message}`);
    }
  }

  /**
   * Update multiple documents
   * @param {Object} query - Query to find documents
   * @param {Object} update - Update operations
   * @returns {Promise<Object>} Update result
   */
  async updateMany(query, update) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateMany(query, update);

      logger.db('updateMany', this.collectionName, {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'UpdateMany operation failed',
        collection: this.collectionName
      });
      throw new DatabaseError(`UpdateMany operation failed: ${error.message}`);
    }
  }

  /**
   * Delete a single document
   * @param {Object} query - Query to find document
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(query) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne(query);

      logger.db('deleteOne', this.collectionName, {
        deletedCount: result.deletedCount
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'DeleteOne operation failed',
        collection: this.collectionName
      });
      throw new DatabaseError(`DeleteOne operation failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple documents
   * @param {Object} query - Query to find documents
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(query) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany(query);

      logger.db('deleteMany', this.collectionName, {
        deletedCount: result.deletedCount
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'DeleteMany operation failed',
        collection: this.collectionName
      });
      throw new DatabaseError(`DeleteMany operation failed: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;
