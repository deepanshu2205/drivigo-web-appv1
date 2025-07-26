import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-image4.png';

function HomePage() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Verified Instructors",
      description: "All our instructors are professionally verified and experienced."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure Payments",
      description: "Safe and secure payment processing with instant confirmations."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Flexible Scheduling",
      description: "Choose your preferred time slots and customize your learning plan."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-light via-white to-accent-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Section: Text and CTA */}
            <div className="lg:w-1/2 text-center lg:text-left animate-slide-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-6 text-gray-900 leading-tight">
                <span className="text-gradient">Drivigo</span> se Seekho!
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Gaadi seekhni h? Hum sikha denge! Learn from verified instructors with personalized lessons and secure payments. Start your driving journey today! ❤️
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/book-lesson" className="btn-primary btn-lg group">
                  <span>Book Your Lesson Now</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link to="/about" className="btn-outline btn-lg">
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-gray-600">Happy Learners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-gray-600">Expert Instructors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Section: Hero Image */}
            <div className="lg:w-1/2 animate-scale-in">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Happy learner after completing driving course"
                  className="w-full h-auto rounded-2xl shadow-large max-h-96 object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-medium">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Live Bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Why Choose Drivigo?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make learning to drive safe, convenient, and affordable with our comprehensive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover card-body text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light text-primary rounded-xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-6">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join thousands of successful learners who chose Drivigo for their driving education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn bg-white text-primary hover:bg-gray-100 btn-lg">
              Create Account
            </Link>
            <Link to="/book-lesson" className="btn border-2 border-white text-white hover:bg-white hover:text-primary btn-lg">
              Book Lesson
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;