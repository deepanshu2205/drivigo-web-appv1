import React, { useState } from 'react';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Thank you for your message! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: "📧",
      title: "Email",
      details: "contact@drivigo.com",
      description: "Send us an email anytime"
    },
    {
      icon: "📞",
      title: "Phone",
      details: "+91 7303537421, +91 9205620971",
      description: "Call us during business hours"
    },
    {
      icon: "📍",
      title: "Address",
      details: "New Delhi, India",
      description: "Visit our office"
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-secondary-900 mb-6">
            Get in <span className="text-gradient">Touch</span>
          </h1>
          <p className="text-xl text-secondary-600 leading-relaxed max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card">
              <h2 className="text-2xl font-display font-bold text-secondary-900 mb-6">
                Send us a Message
              </h2>
              
              {submitMessage && (
                <div className="mb-6 p-4 bg-success-50 text-success-700 border border-success-200 rounded-lg">
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="input-field resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending message...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-display font-bold text-secondary-900 mb-6">
                  Contact Information
                </h2>
                <p className="text-secondary-600 mb-8">
                  Reach out to us through any of these channels. We're here to help!
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="text-3xl">{info.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                        {info.title}
                      </h3>
                      <p className="text-secondary-900 font-medium mb-1">
                        {info.details}
                      </p>
                      <p className="text-secondary-600 text-sm">
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business Hours */}
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Business Hours
                </h3>
                <div className="space-y-2 text-secondary-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary-600">
              Find quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                How do I book a driving lesson?
              </h3>
              <p className="text-secondary-600">
                Simply sign up for an account, browse available instructors, and book a lesson that fits your schedule.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Are all instructors verified?
              </h3>
              <p className="text-secondary-600">
                Yes, all our instructors go through a thorough verification process including background checks and certification verification.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-secondary-600">
                We accept all major credit cards, debit cards, and digital wallets for secure payment processing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;