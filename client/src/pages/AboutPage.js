import React from 'react';

function AboutPage() {
  const values = [
    {
      icon: "🛡️",
      title: "Safety First",
      description: "We prioritize safety in everything we do, ensuring all instructors meet strict safety standards."
    },
    {
      icon: "🤝",
      title: "Trust & Reliability",
      description: "Building trust through verified instructors and transparent booking processes."
    },
    {
      icon: "📚",
      title: "Quality Education",
      description: "Comprehensive driving lessons tailored to individual learning needs and styles."
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "Leveraging technology to make learning to drive accessible and convenient."
    }
  ];

  const stats = [
    { number: "1000+", label: "Happy Learners" },
    { number: "50+", label: "Expert Instructors" },
    { number: "95%", label: "Success Rate" },
    { number: "4.8", label: "Average Rating" }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-secondary-900 mb-6">
            About <span className="text-gradient">Drivigo</span>
          </h1>
          <p className="text-xl text-secondary-600 leading-relaxed max-w-3xl mx-auto">
            Drivigo was founded with a simple mission: to connect aspiring drivers with professional, 
            vetted, and friendly instructors in their local area. We believe that learning to drive 
            should be a safe, comfortable, and empowering experience.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-secondary-600 leading-relaxed mb-6">
                Our platform makes it easy to find an instructor who fits your schedule and learning style, 
                so you can get on the road with confidence. We're committed to making driving education 
                accessible, affordable, and enjoyable for everyone.
              </p>
              <p className="text-lg text-secondary-600 leading-relaxed">
                Whether you're a complete beginner or looking to improve your skills, our verified 
                instructors are here to guide you every step of the way. We believe that everyone 
                deserves the opportunity to learn to drive safely and confidently.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-primary rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-display font-bold mb-4">Why Choose Drivigo?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified and certified instructors
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Flexible scheduling options
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Secure payment processing
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    24/7 customer support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary-50">
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

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              These core values guide everything we do at Drivigo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="card-hover text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {value.icon}
                </div>
                <h3 className="text-xl font-display font-semibold text-secondary-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {value.description}
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
            <a 
              href="/signup" 
              className="bg-white text-primary-600 hover:bg-secondary-50 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started Today
            </a>
            <a 
              href="/contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;