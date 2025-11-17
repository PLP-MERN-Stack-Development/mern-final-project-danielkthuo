import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  Star,
  PlayCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Globe
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const stats = [
    { number: '10K+', label: 'Active Students' },
    { number: '500+', label: 'Expert Courses' },
    { number: '50+', label: 'Expert Instructors' },
    { number: '98%', label: 'Success Rate' }
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Courses',
      description: 'Access a wide range of courses across different categories and skill levels with expert-curated content.',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed progress tracking, analytics, and personalized insights.',
      color: 'green'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant updates on your progress and course activities with real-time notifications.',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Join discussions, share insights, and collaborate with peers in our vibrant learning community.',
      color: 'orange'
    },
    {
      icon: Award,
      title: 'Certification',
      description: 'Earn recognized certificates upon course completion to showcase your skills to employers.',
      color: 'pink'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Learn with confidence on our secure, reliable platform with industry-standard encryption.',
      color: 'indigo'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Web Developer',
      content: 'LearnHub transformed my career. The courses are practical and the community support is amazing!',
      avatar: 'SC'
    },
    {
      name: 'Marcus Johnson',
      role: 'Data Scientist',
      content: 'The progress tracking helped me stay motivated and complete my learning goals efficiently.',
      avatar: 'MJ'
    },
    {
      name: 'Emily Davis',
      role: 'UX Designer',
      content: 'Real-time updates and expert feedback made all the difference in my learning journey.',
      avatar: 'ED'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Transform Your Career Today
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Learn <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Without</span> Limits
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
              Advance your career with our comprehensive learning platform. 
              Access expert-led courses, track your progress, and achieve your learning goals with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/courses"
                    className="group inline-flex items-center gap-3 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
                  >
                    <PlayCircle className="w-5 h-5" />
                    Browse Courses
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold mb-1">{stat.number}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LearnHub?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform offers everything you need to succeed in your learning journey, 
              backed by cutting-edge technology and expert guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-200 hover:border-blue-200 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-14 h-14 ${getColorClasses(feature.color)} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Learners Worldwide</h3>
              <p className="text-gray-600">Join our community of successful students</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-4">
                    {testimonial.avatar}
                  </div>
                  <div className="flex justify-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Future?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90 leading-relaxed">
            Join thousands of students who are already advancing their careers with LearnHub. 
            Start your journey today and unlock your potential.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={user ? "/courses" : "/register"}
              className="group inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {user ? "Explore Courses" : "Start Learning Now"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {!user && (
              <Link
                to="/login"
                className="group inline-flex items-center gap-3 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Sign In to Account
              </Link>
            )}
          </div>

          {/* Additional Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Globe className="w-5 h-5 text-green-300" />
              <span className="text-sm">Learn at your own pace</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Award className="w-5 h-5 text-green-300" />
              <span className="text-sm">Earn certificates</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;