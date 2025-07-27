import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-image4.png';

function HomePage() {
  const features = [
    {
      icon: "🚗",
      title: "Verified Instructors",
      description: "All our instructors are thoroughly verified and certified professionals"
    },
    {
      icon: "🔒",
      title: "Secure Payments",
      description: "Safe and secure payment processing with multiple options"
    },
    {
      icon: "📱",
      title: "Easy Booking",
      description: "Book your lessons in just a few clicks from anywhere"
    },
    {
      icon: "⭐",
      title: "Quality Training",
      description: "Comprehensive driving lessons tailored to your needs"
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Learners" },
    { number: "50+", label: "Expert Instructors" },
    { number: "1000+", label: "Lessons Completed" },
    { number: "4.8", label: "Average Rating" }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-secondary-900 mb-6 leading-tight">
                Drivigo se 
                <span className="text-gradient block"> Seekho!</span>
              </h1>
              <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
                Gaadi seekhni h? Hum sikha denge! Verified instructors se seekho aur securely pay kro ❤️
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/book-lesson" 
                  className="btn-primary text-lg px-8 py-4"
                >
                  Book Your First Lesson
                </Link>
                <Link 
                  to="/about" 
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src={heroImage}
                  alt="A person who has learned driving and is confident and happy"
                  className="w-full h-auto max-w-lg mx-auto animate-bounce-gentle"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary-200 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-display font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-4">
              Why Choose Drivigo?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              We make learning to drive simple, safe, and enjoyable with our comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-semibold text-secondary-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-6">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of learners who have successfully learned to drive with Drivigo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-white text-primary-600 hover:bg-secondary-50 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started Today
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;