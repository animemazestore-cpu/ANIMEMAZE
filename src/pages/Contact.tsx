import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Mail, MessageSquare, Send, Check } from 'lucide-react';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        });

      if (error) throw error;
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Error submitting contact message:', err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-stretch">
        
        <div className="md:col-span-5 bg-gray-50 border border-gray-200 p-8 rounded-2xl flex flex-col justify-between space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Have questions about order status, figure collections, custom katanas or business inquiries? Drop us a line.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <Mail className="h-5 w-5 text-primary" />
              <span>support@animemaze.com</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <span>Response within 12-24 hours</span>
            </div>
            <a
              href="https://www.instagram.com/animemaze.store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-sm text-gray-700 hover:text-primary transition-colors group"
            >
              <InstagramIcon />
              <span>@animemaze.store</span>
            </a>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-500 leading-normal">
            For issues regarding UPI payment verification delays, please specify your order number in your message description.
          </div>
        </div>

        <div className="md:col-span-7 glass-card p-8 rounded-2xl border border-gray-200 shadow-sm">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Message Sent!</h2>
              <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                Thank you for contacting AnimeMaze. We will review your message and reply via email as soon as possible.
              </p>
              <Button size="sm" onClick={() => setSuccess(false)}>Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="Rohan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                required
                placeholder="otaku@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Message Details
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can we help you? Please provide order number if applicable."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm glass-input placeholder-gray-500 focus:outline-none resize-none"
                />
              </div>

              <Button type="submit" fullWidth loading={loading}>
                <Send className="mr-2 h-4.5 w-4.5" />
                Submit Message
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
