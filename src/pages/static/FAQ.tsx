import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="font-semibold text-sm sm:text-base">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 pt-2 border-t border-gray-200 bg-gray-50 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "How do I make a payment on AnimeMaze?",
      answer: "We support a Manual UPI Payment system. When you check out, we display our UPI ID (8445619079@fam) along with a dynamic QR code. You can make the payment using any UPI app (like GPay, PhonePe, Paytm) and take a screenshot of the successful transaction. Upload this screenshot on the checkout page to place your order. Our team will verify it within 12-24 hours."
    },
    {
      question: "Are these products original or replicas?",
      answer: "We offer both high-quality premium replicas (clearly stated in product descriptions) and authentic imported collectibles. All anime figure descriptions specify details like size, materials, and origin so you know exactly what you are purchasing."
    },
    {
      question: "What is the policy for decorative katanas?",
      answer: "All decorative katanas sold on AnimeMaze are display props only. They are made of wood, foam, or blunt stainless steel. They are NOT sharp, cannot be sharpened, and are intended solely for cosplay, collection, or home decoration. By purchasing, you agree to use them responsibly."
    },
    {
      question: "How long does shipping and delivery take?",
      answer: "Once your payment is manually verified, we process orders within 1-2 business days. Shipping usually takes 5-7 business days depending on your delivery location. You will receive tracking details via email/dashboard as soon as it is shipped."
    },
    {
      question: "Can I cancel or return my order?",
      answer: "Yes, you can request order cancellation before it enters 'SHIPPED' status. If you receive a damaged or incorrect product, you can file a refund request under our Refund Policy within 7 days of delivery, attaching unboxing photos or videos."
    },
    {
      question: "How do I track my order status?",
      answer: "You can track the status of your order under your User Dashboard > My Orders tab. The statuses are: PENDING_VERIFICATION (verifying UPI screenshot), PAID (verified), PROCESSING (packing), SHIPPED, DELIVERED, and CANCELLED."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-center text-gray-900 mb-4">
        Frequently Asked Questions
      </h1>
      <p className="text-gray-600 text-center text-sm sm:text-base max-w-lg mx-auto mb-12">
        Got questions? We've got answers. If you can't find what you are looking for, feel free to contact our customer support team.
      </p>
      <div className="mt-8">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};
