const { Kafka, Partitioners } = require('kafkajs');

// Initialize Kafka Client
const kafka = new Kafka({
  clientId: 'devtinder-backend',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  // In production, add SSL/SASL config here
});

// Create Producer (Using DefaultPartitioner or LegacyPartitioner depending on Kafkajs version)
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Create Consumer (We'll instantiate consumer groups where needed)
const createConsumer = (groupId) => {
  return kafka.consumer({ groupId });
};

// Utility to connect producer (call this in app.js on startup)
const connectKafkaProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer connected successfully');
  } catch (error) {
    console.error('❌ Error connecting Kafka Producer:', error);
  }
};

// Utility to publish a message to a topic
const publishMessage = async (topic, key, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ key: key, value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error(`❌ Error publishing message to topic ${topic}:`, error);
  }
};

module.exports = {
  kafka,
  producer,
  createConsumer,
  connectKafkaProducer,
  publishMessage,
};
