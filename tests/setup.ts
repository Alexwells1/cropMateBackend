// Load test environment before anything imports config
process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI_TEST'] = 'mongodb://localhost:27017/cropmate_test';
process.env['JWT_SECRET'] = 'test_jwt_secret_that_is_at_least_32_characters_long';
process.env['JWT_REFRESH_SECRET'] = 'test_refresh_secret_also_at_least_32_characters';
process.env['CLOUDINARY_CLOUD_NAME'] = 'test_cloud';
process.env['CLOUDINARY_API_KEY'] = 'test_api_key';
process.env['CLOUDINARY_API_SECRET'] = 'test_api_secret';
process.env['AI_SERVICE_URL'] = 'http://localhost:9999/mock';
process.env['AI_SERVICE_API_KEY'] = 'test_ai_key';
process.env['OPENWEATHER_API_KEY'] = 'test_weather_key';
process.env['ISDA_SOIL_API_KEY'] = 'test_soil_key';
process.env['REDIS_HOST'] = ''; // Disable Redis in tests
process.env['CORS_ALLOWED_ORIGINS'] = 'http://localhost:3000';
