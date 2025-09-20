import React from 'react';
import Button from '../components/common/Button';

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="p-6 h-full rounded-lg border flex flex-col" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
        <div className="flex-shrink-0">{icon}</div>
        <h3 className="text-xl font-bold my-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm flex-grow" style={{ color: 'var(--text-secondary)' }}>
            {description}
        </p>
    </div>
);

const TrustSection: React.FC<{ title: string, body: string }> = ({ title, body }) => (
    <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{body}</p>
    </div>
);


const HomePage: React.FC = () => {
    return (
        <div className="text-center py-20 px-4">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight" style={{ color: 'var(--primary)' }}>
                Turn Your Waste into Worth.
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                The future of waste logistics is here. We connect kitchens with collectors to create a seamless, compliant, and profitable circular economy for used cooking oil.
            </p>
            <div className="flex justify-center space-x-4">
                <Button to="/signup">
                  Sign Up as a Supplier
                </Button>
                <Button to="/signup" variant="secondary">
                  Sign Up as a Driver
                </Button>
            </div>

            <div className="mt-24 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M12 21v-1m0 1v.01M12 20v-1m0-1v-1m-4-2.291c.26-1.64 1-3.235 1-4.709 0-1.28.24-2.48.66-3.582M16 13.709c-.26-1.64-1-3.235-1-4.709 0-1.28-.24-2.48-.66-3.582" /></svg>}
                    title="Get Paid for Your Waste"
                    description="Stop paying for UCO disposal. Our platform connects you with a network of buyers, turning your used cooking oil into a reliable new revenue stream with transparent, calculated rebates."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    title="Earn More for Quality Work"
                    description="Move beyond flat fees. Our merit-based Genesis Point system rewards drivers directly for volume, quality, and efficiency. The better you work, the bigger your share of the monthly profits."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    title="Effortless Compliance, Guaranteed"
                    description="Say goodbye to paperwork. Every collection is instantly recorded as a Digital Waste Transfer Note on the blockchain, providing immutable, auditable proof that meets all legal requirements."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    title="A True Circular Economy"
                    description="Join a transparent network that tracks every drop from kitchen to biofuel plant, helping you prove your environmental impact and contribute to a sustainable future."
                />
            </div>

            <div className="mt-24 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <TrustSection 
                    title="Immutable Proof. Unmatched Compliance."
                    body="Every kilogram of UCO is tracked from your kitchen to the biofuel plant. Our Digital Waste Transfer Notes are minted on the Polygon blockchain, creating a permanent, auditable record that can never be lost, altered, or disputed. This is compliance you can count on."
                />
                <TrustSection 
                    title="A System Built on Radical Transparency."
                    body="From real-time driver tracking for suppliers to a clear Genesis Point breakdown for drivers, our platform is designed for total clarity. Know exactly where your oil is going, and understand precisely how you've earned. This is the new standard for trustworthy logistics."
                />
            </div>
        </div>
    );
};

export default HomePage;