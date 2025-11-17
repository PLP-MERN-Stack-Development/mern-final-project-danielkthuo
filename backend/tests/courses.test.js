import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

let authToken;
let instructorToken;

beforeAll(async () => {
  // Create test instructor
  const instructor = await User.create({
    name: 'Test Instructor',
    email: 'instructor@test.com',
    password: 'password123',
    role: 'instructor'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'instructor@test.com',
      password: 'password123'
    });

  instructorToken = loginRes.body.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await mongoose.connection.close();
});

describe('Courses API', () => {
  test('should get all courses', async () => {
    const response = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.courses)).toBe(true);
  });

  test('should create a new course', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'web-development',
      level: 'beginner',
      price: 0
    };

    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.course.title).toBe(courseData.title);
  });
});