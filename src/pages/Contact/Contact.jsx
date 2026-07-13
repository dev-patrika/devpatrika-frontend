import React, { useState } from 'react';
import { Mail, Send, Copy, Check, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('i.e.ishantiwari@gmail.com');
    setCopied(true);
    toast.success('Email address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    const to = 'i.e.ishantiwari@gmail.com';
    const emailSubject = encodeURIComponent(`[Dev Patrika Dispatch] ${formData.subject}`);
    const emailBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    
    const mailtoUrl = `mailto:${to}?subject=${emailSubject}&body=${emailBody}`;
    
    // Redirect to mail client
    window.location.href = mailtoUrl;
    
    setIsSubmitting(false);
    toast.success('Redirecting to your mail client...');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in px-4 md:px-0">
      
      {/* SIMPLE HEADER */}
      <header className="border-b border-border pb-4 select-none">
        <h1 className="font-serif text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Contact Us
        </h1>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Get in touch with the Dev Patrika editorial desk and developer intelligence team.
        </p>
      </header>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
        
        {/* LEFT COLUMN: CONTACT/FEEDBACK FORM */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-foreground">Leave Us a Message</h3>
            <p className="text-xs text-muted-foreground">
              Have feedback, features requests, bug reports, or curation ideas? Drop our editors a line.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-xs text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-xs text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this dispatch about?"
                className="w-full px-4 py-2.5 bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-xs text-foreground placeholder:text-muted-foreground/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Message / Feedback
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your thoughts here..."
                rows="5"
                className="w-full px-4 py-2.5 bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-xs text-foreground placeholder:text-muted-foreground/50 resize-none"
                required
              ></textarea>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full h-10 uppercase tracking-wider text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md border border-primary/20"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send Dispatch
                </>
              )}
            </Button>
          </form>
        </div>

        {/* RIGHT COLUMN: DISPATCH BOX DETAILS */}
        <div className="space-y-6 lg:pl-4">
          <div className="p-6 border border-foreground/15 bg-muted/20 rounded-2xl space-y-4">
            <h3 className="font-serif font-black italic text-xl border-b border-foreground pb-2">
              The Dispatch Desk
            </h3>
            
            <p className="font-['Times_New_Roman',_Times,_serif] text-xs leading-relaxed text-muted-foreground">
              "Dev Patrika is constructed by and for the technical pioneer. Our compilers sift through the noise of the global web to curate code intelligence, preprints, and developer news daily."
            </p>
            
            <p className="font-['Times_New_Roman',_Times,_serif] text-xs leading-relaxed text-muted-foreground">
              If you have discovered an emerging framework, an interesting technical preprint, or found something broken in our pipelines, don't hesitate to reach out. Our lines are always open.
            </p>
            
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-bold pt-2">
              <Terminal className="h-4 w-4 text-primary" /> Verified Editor Desk
            </div>
          </div>

          {/* ELEGANT EMAIL BOX */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              Direct Contact
            </span>
            
            <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-xl border border-border/80">
              <div className="flex items-center gap-2 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                <Mail className="h-3.5 w-3.5" /> Official Channel
              </div>
              
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="font-mono text-xs font-bold text-foreground truncate select-all">
                  i.e.ishantiwari@gmail.com
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="p-2 border border-border bg-card hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-sm shrink-0"
                  title="Copy email address"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* DEVPATRIKA MOTO QUOTE */}
          <div className="text-center pt-2 select-none">
            <p className="font-['Times_New_Roman',_Times,_serif] text-[11px] italic text-muted-foreground leading-normal">
              "The software journal of record for the enlightened engineer."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
