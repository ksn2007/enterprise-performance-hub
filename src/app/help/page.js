'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { getUserProfile } from '../../utils/auth';
import DashboardLayout from '../../components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketData, setTicketData] = useState({ subject: '', category: 'goals', message: '' });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      const prof = await getUserProfile(user.uid);
      if (!prof) {
        router.replace('/login');
        return;
      }
      setProfile(prof);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const faqs = [
    {
      q: 'How do I add weightage to my goals?',
      a: 'Navigate to the My Goals page, click "New Goal" or edit a draft, and enter a percentage weightage. Note that according to corporate rules, your total weightage across all active goals must sum to exactly 100% before submission.'
    },
    {
      q: 'Why are my goals locked from editing?',
      a: 'Once goals are submitted or manager-approved, they are locked to maintain audit trail compliance. If you need to make corrections, click the "Request Unlock" button on the goal card to send a notification to your administrator.'
    },
    {
      q: 'How does the manager approvals flow work?',
      a: 'When an employee submits goals, they enter the manager approvals queue. Managers can either Approve (which locks the goals) or Return for Rework (which unlocks them and sends feedback). All cycles are captured in the team activity feed.'
    },
    {
      q: 'Can I share department KPIs across employees?',
      a: 'Yes, managers can create department-level Shared KPIs and assign them to multiple team members simultaneously. The progress on shared targets synchronizes in real-time across the company.'
    }
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketData({ subject: '', category: 'goals', message: '' });
    }, 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">Loading Help Center...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role={profile.role}>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-outline-variant relative overflow-hidden">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-[140px] pointer-events-none material-symbols-outlined">help</div>
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 bg-primary/10 text-primary text-label-sm font-semibold rounded-full uppercase tracking-wider">Help & Support</span>
            <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-primary">How can we help you, {profile.name}?</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Find guides, answers to frequently asked questions, or raise a support ticket directly with our performance administration team.
            </p>
          </div>
        </div>

        {/* Search Suggestion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-3 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-primary text-[32px]">menu_book</span>
            <h3 className="font-headline-sm text-headline-sm font-bold">Goal-Setting Guide</h3>
            <p className="text-body-sm text-on-surface-variant">Learn the rules for UOM selections, setting weights, and department alignment.</p>
            <button className="text-label-md text-primary font-bold flex items-center gap-1 hover:underline">Read Guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
          </div>
          <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-3 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-primary text-[32px]">gavel</span>
            <h3 className="font-headline-sm text-headline-sm font-bold">Compliance Policies</h3>
            <p className="text-body-sm text-on-surface-variant">Read the performance hub audit trail rules and security specifications.</p>
            <button className="text-label-md text-primary font-bold flex items-center gap-1 hover:underline">View Policies <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
          </div>
          <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-3 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-primary text-[32px]">group</span>
            <h3 className="font-headline-sm text-headline-sm font-bold">Role Capabilities</h3>
            <p className="text-body-sm text-on-surface-variant">Understand your authorization levels across Employee, Manager, and Admin roles.</p>
            <button className="text-label-md text-primary font-bold flex items-center gap-1 hover:underline">Check Access <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
          </div>
        </div>

        {/* FAQ and Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Accordions */}
          <div className="space-y-4">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">quiz</span> Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-outline-variant rounded-xl bg-white overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left font-label-md text-label-md flex justify-between items-center hover:bg-surface-container-low transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-primary' : 'text-outline'}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`transition-all duration-200 overflow-hidden ${activeFaq === idx ? 'max-h-40 border-t border-outline-variant bg-surface-container-lowest p-5' : 'max-h-0'}`}>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raise Support Ticket Form */}
          <div className="bg-white border border-outline-variant rounded-2xl p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span> Submit Support Ticket
              </h2>
              <p className="text-body-sm text-on-surface-variant">Can't find your answer? Let our system admin team know.</p>
            </div>

            {ticketSubmitted ? (
              <div className="bg-primary/10 border border-primary/20 text-primary p-6 rounded-xl flex flex-col items-center gap-3 text-center animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[48px] animate-bounce">check_circle</span>
                <h3 className="font-headline-sm text-headline-sm font-bold">Ticket Submitted Successfully</h3>
                <p className="text-body-sm max-w-sm">We have assigned ticket ID #{Math.floor(Math.random() * 90000) + 10000} to your request. Our support team will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="subject">Subject</label>
                  <input 
                    required 
                    type="text" 
                    id="subject"
                    value={ticketData.subject} 
                    onChange={e => setTicketData({...ticketData, subject: e.target.value})}
                    placeholder="e.g. Need help unlocking draft KPI" 
                    className="px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-body-md placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="category">Category</label>
                  <select 
                    id="category"
                    value={ticketData.category}
                    onChange={e => setTicketData({...ticketData, category: e.target.value})}
                    className="px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-md outline-none cursor-pointer focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  >
                    <option value="goals">Goal setting & rules</option>
                    <option value="approvals">Approvals & return queues</option>
                    <option value="unlocks">Goal lock & unlocks</option>
                    <option value="other">System / Other issue</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="message">Message</label>
                  <textarea 
                    required 
                    rows="3" 
                    id="message"
                    value={ticketData.message}
                    onChange={e => setTicketData({...ticketData, message: e.target.value})}
                    placeholder="Describe the issue in detail..." 
                    className="px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-body-md placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">send</span> Send Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
