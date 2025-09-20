import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { UserRole } from '../types';

// #region Stepper Components
const STEPS = [
  'License Verification',
  'Vehicle Verification',
  'Purchase Containers',
  'Mandatory Training',
];

const LicenseStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Step 1: License Verification</h3>
        <Input id="license-number" label="Upper Tier Waste Carrier Registration Number" placeholder="e.g., CBDU123456" />
        <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Upload License Document</label>
            <input type="file" className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-black hover:file:bg-teal-300 cursor-pointer"/>
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            Don't have a license? <a href="https://www.gov.uk/waste-carrier-or-broker-registration" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--primary)]">Register with the UK government.</a>
        </p>
        <Button onClick={onComplete} className="w-full py-3">Next: Vehicle Verification</Button>
    </div>
);

const VehicleStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Step 2: Vehicle Verification</h3>
        <Input id="vehicle-reg" label="Vehicle Registration (Number Plate)" placeholder="e.g., AB12 CDE" />
        <select
            id="vehicle-type"
            className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
            style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)', 
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
            } as React.CSSProperties}
        >
            <option>Select Vehicle Type</option>
            <option>Small Van</option>
            <option>Large Van</option>
            <option>Lorry</option>
        </select>
        <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Upload Vehicle Photos</label>
            <input type="file" multiple className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-black hover:file:bg-teal-300 cursor-pointer"/>
        </div>
        <Button onClick={onComplete} className="w-full py-3">Next: Purchase Containers</Button>
    </div>
);

const PurchaseContainersStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [purchasing, setPurchasing] = useState(false);
    const [purchased, setPurchased] = useState(false);

    const handlePurchase = () => {
        setPurchasing(true);
        setTimeout(() => {
            setPurchasing(false);
            setPurchased(true);
        }, 2000);
    };

    return (
        <div className="space-y-6 text-center animate-fade-in">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Step 3: Purchase Containers</h3>
            <div className="p-6 border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-lg font-bold">Driver Starter Pack</h4>
                <p className="text-3xl font-extrabold my-2" style={{ color: 'var(--primary)' }}>£149.99</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Includes 20x 10L durable, reusable collection containers. A minimum container stock is required to accept jobs.</p>
            </div>
            {!purchased ? (
                <Button onClick={handlePurchase} disabled={purchasing} className="w-full py-3">
                    {purchasing ? 'Processing Payment...' : 'Purchase with Stripe'}
                </Button>
            ) : (
                <div className="p-4 bg-green-500 bg-opacity-10 text-green-300 rounded-md border border-green-500/30">
                    Purchase complete! Your containers will be shipped to your registered address.
                </div>
            )}
            <Button onClick={onComplete} disabled={!purchased} className="w-full py-3">Next: Mandatory Training</Button>
        </div>
    );
};

const Quiz: React.FC<{ onPass: () => void }> = ({ onPass }) => {
    const questions = [
        {
            question: "What does our app create for every collection to ensure legal compliance?",
            options: ["An invoice", "A Digital Waste Transfer Note", "A receipt"],
            answer: "A Digital Waste Transfer Note"
        },
        {
            question: "Which of these is considered 'High' contamination?",
            options: ["A few breadcrumbs", "Clean, clear oil", "Water mixed in with the oil"],
            answer: "Water mixed in with the oil"
        }
    ];
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [showResult, setShowResult] = useState(false);
    const [passed, setPassed] = useState(false);

    const handleAnswer = (questionIndex: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleSubmit = () => {
        let score = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answer) {
                score++;
            }
        });
        const hasPassed = score === questions.length;
        setPassed(hasPassed);
        setShowResult(true);
        if (hasPassed) {
            setTimeout(onPass, 1500);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Knowledge Quiz</h3>
            {questions.map((q, i) => (
                <div key={i}>
                    <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map(option => (
                            <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-[var(--border-color)] has-[:checked]:bg-[var(--primary)] has-[:checked]:text-black has-[:checked]:border-[var(--primary)] transition-colors cursor-pointer">
                                <input type="radio" name={`question-${i}`} value={option} onChange={() => handleAnswer(i, option)} className="w-4 h-4 text-[var(--primary)] bg-gray-700 border-gray-600 focus:ring-[var(--primary)]" />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            {showResult && (
                <p className={`text-center font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                    {passed ? 'Correct! Well done.' : 'Not quite. Please review the material and try again.'}
                </p>
            )}
            <Button onClick={handleSubmit} className="w-full py-3">Submit Answers</Button>
        </div>
    );
};

const TrainingStep: React.FC = () => {
    const [viewingQuiz, setViewingQuiz] = useState(false);
    const [quizPassed, setQuizPassed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user, reloadUser } = useAuth();
    const navigate = useNavigate();

    const handleCompleteOnboarding = async () => {
        setLoading(true);
        setTimeout(async () => {
            if (user) {
                const updatedUser = { ...user, onboardingComplete: true };
                localStorage.setItem('reloop_session', JSON.stringify(updatedUser));
                await reloadUser();
            }
            setLoading(false);
            navigate('/dashboard');
        }, 1000);
    };

    if (quizPassed) {
        return (
            <div className="text-center space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-green-400">Training Complete!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Congratulations, you've passed the final step. You're now ready to join the network.</p>
                <Button onClick={handleCompleteOnboarding} disabled={loading} className="w-full py-3">
                    {loading ? 'Finalizing...' : 'Finish Setup & View Dashboard'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {!viewingQuiz ? (
                <>
                    <h3 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Step 4: Mandatory Training</h3>
                    <div className="space-y-4 text-sm p-4 border rounded-lg max-h-60 overflow-y-auto" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        <h4 className="font-bold text-white">1. Waste Transfer Notes (WTNs)</h4>
                        <p>A WTN is a legal document that must be completed for every waste transfer. Our app creates a Digital WTN automatically for every job, ensuring you are always compliant.</p>
                        <h4 className="font-bold text-white">2. Oil Contamination</h4>
                        <p>It's crucial to correctly identify oil quality. 'None' means clean oil. 'Low' includes minor food particles. 'High' contamination includes water, solids, or other liquids, which significantly reduces its value.</p>
                        <h4 className="font-bold text-white">3. Safety First</h4>
                        <p>Always wear appropriate PPE. Ensure containers are sealed correctly to prevent spills. Never lift more than you can handle safely.</p>
                    </div>
                    <Button onClick={() => setViewingQuiz(true)} className="w-full py-3">Start Quiz</Button>
                </>
            ) : (
                <Quiz onPass={() => setQuizPassed(true)} />
            )}
        </div>
    );
};

// #endregion

const DriverOnboarding: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <LicenseStep onComplete={goToNextStep} />;
            case 2: return <VehicleStep onComplete={goToNextStep} />;
            case 3: return <PurchaseContainersStep onComplete={goToNextStep} />;
            case 4: return <TrainingStep />;
            default: return null;
        }
    };

    return (
        <div className="flex items-center justify-center py-12">
            <div className="max-w-2xl w-full p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <h2 className="text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Driver Onboarding</h2>
                <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Complete the following steps to start earning.</p>
                
                <div className="flex justify-between items-start mb-10">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center text-center w-24">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                                    currentStep > index ? 'bg-[var(--primary)] text-black' : 
                                    currentStep === index + 1 ? 'border-2 border-[var(--primary)] text-[var(--primary)] scale-110' : 'border-2 border-[var(--border-color)] text-[var(--text-secondary)]'
                                }`}>
                                    {currentStep > index ? '✓' : index + 1}
                                </div>
                                <p className={`text-xs mt-2 transition-colors ${currentStep >= index + 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{step}</p>
                            </div>
                            {index < STEPS.length - 1 && <div className="flex-1 h-0.5 mt-5 mx-2 bg-[var(--border-color)]"></div>}
                        </React.Fragment>
                    ))}
                </div>
                <div>{renderStep()}</div>
            </div>
        </div>
    );
};

const GenericOnboarding: React.FC = () => {
    const { user, reloadUser } = useAuth();
    const [address, setAddress] = useState(user?.address || '');
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(async () => {
            if (user) {
                const updatedUser = { ...user, address, walletAddress, onboardingComplete: true };
                localStorage.setItem('reloop_session', JSON.stringify(updatedUser));
                await reloadUser();
            }
            setLoading(false);
            navigate('/dashboard');
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center py-12">
            <div className="max-w-lg w-full p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <h2 className="text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Complete Your Profile</h2>
                <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>A few more details to get you set up on the network.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input id="address" label="Your Collection Address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    <div>
                        <Input id="walletAddress" label="Your Secure Wallet Address" type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} required />
                        <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Why we need this: Your secure wallet address is used to track your Genesis Points and process your automated monthly profit-share payments.
                        </p>
                    </div>
                    <div>
                        <Button type="submit" disabled={loading} className="w-full py-3">
                            {loading ? 'Saving...' : 'Finish Setup & View Dashboard'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OnboardingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.onboardingComplete) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    if (!user) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return user.role === UserRole.DRIVER ? <DriverOnboarding /> : <GenericOnboarding />;
};

export default OnboardingPage;
