import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional)
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing courses and lessons');

    // Find or create an instructor
    let instructor = await User.findOne({ email: 'instructor@learnhub.com' });
    
    if (!instructor) {
      instructor = await User.create({
        name: 'John Instructor',
        email: 'instructor@learnhub.com',
        password: 'password123',
        role: 'instructor',
        bio: 'Experienced web developer and instructor with 10+ years of experience'
      });
      console.log('✅ Created instructor account');
    }

    // Sample courses data
    const sampleCourses = [
      {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn web development from scratch with HTML, CSS, JavaScript, React, Node.js and more! Become a full-stack developer with this comprehensive course.',
        instructor: instructor._id,
        category: 'web-development',
        level: 'beginner',
        price: 0,
        requirements: [
          'Basic computer knowledge',
          'No programming experience required',
          'Willingness to learn'
        ],
        learningOutcomes: [
          'Build responsive websites with HTML and CSS',
          'Create dynamic web applications with JavaScript',
          'Develop full-stack applications with React and Node.js',
          'Deploy applications to the cloud',
          'Understand modern development tools and workflows'
        ],
        isPublished: true
      },
      {
        title: 'Data Science Fundamentals',
        description: 'Master the fundamentals of data science with Python, pandas, numpy, and machine learning. Perfect for beginners starting their data science journey.',
        instructor: instructor._id,
        category: 'data-science',
        level: 'beginner',
        price: 49.99,
        requirements: [
          'Basic Python knowledge',
          'High school math level'
        ],
        learningOutcomes: [
          'Perform data analysis with Python',
          'Create data visualizations',
          'Build machine learning models',
          'Work with real-world datasets',
          'Understand statistical concepts'
        ],
        isPublished: true
      },
      {
        title: 'UI/UX Design Masterclass',
        description: 'Learn professional UI/UX design principles, tools, and workflows. Create beautiful and user-friendly interfaces that solve real problems.',
        instructor: instructor._id,
        category: 'design',
        level: 'intermediate',
        price: 79.99,
        requirements: [
          'Basic design sense',
          'Familiarity with design tools is a plus'
        ],
        learningOutcomes: [
          'Design user-centered interfaces',
          'Create wireframes and prototypes',
          'Conduct user research',
          'Use design systems effectively',
          'Collaborate with developers'
        ],
        isPublished: true
      }
    ];

    // Create courses and lessons
    for (const courseData of sampleCourses) {
      const course = await Course.create(courseData);
      console.log(`✅ Created course: ${course.title}`);

      // Create sample lessons for each course
      const lessons = await Lesson.create([
        {
          title: 'Introduction to the Course',
          content: `Welcome to ${course.title}! In this course, you'll learn everything you need to know to get started. This introductory lesson will give you an overview of what to expect.`,
          course: course._id,
          order: 1,
          duration: 15,
          isFree: true
        },
        {
          title: 'Setting Up Your Development Environment',
          content: 'Before we dive into coding, let\'s set up your development environment. We\'ll install all the necessary tools and software to get you started.',
          course: course._id,
          order: 2,
          duration: 30,
          isFree: true
        },
        {
          title: 'Core Concepts and Fundamentals',
          content: 'In this lesson, we\'ll cover the fundamental concepts that form the foundation of everything you\'ll learn in this course.',
          course: course._id,
          order: 3,
          duration: 45
        }
      ]);

      // Update course with lessons
      course.lessons = lessons.map(lesson => lesson._id);
      await course.save();

      console.log(`✅ Added ${lessons.length} lessons to ${course.title}`);
    }

    console.log('🎉 Sample data seeded successfully!');
    console.log('📧 Instructor login: instructor@learnhub.com / password123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedData();