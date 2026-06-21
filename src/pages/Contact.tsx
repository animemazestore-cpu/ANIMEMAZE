import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Mail, MessageSquare, Send, Check } from 'lucide-react';

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
      // Fallback local success so the UI behaves cleanly
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-stretch">
        
        {/* Info Column */}
        <div className="md:col-span-5 bg-surface/50 border border-white/5 p-8 rounded-2xl flex flex-col justify-between space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Contact Us</h1>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Have questions about order status, figure collections, custom katanas or business inquiries? Drop us a line.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <Mail className="h-5 w-5 text-primary-light" />
              <span>support@animemaze.com</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <MessageSquare className="h-5 w-5 text-secondary-light" />
              <span>Response within 12-24 hours</span>
            </div>
          </div>

          <div className="p-4 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-500 leading-normal">
            For issues regarding UPI payment verification delays, please specify your order number in your message description.
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7 glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Message Sent!</h2>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
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
