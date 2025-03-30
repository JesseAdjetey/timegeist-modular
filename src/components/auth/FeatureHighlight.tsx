
import React from 'react';
import { Calendar, Clock, Layout, ListTodo } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-lg text-white mb-1">{title}</h3>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </div>
  );
};

const FeatureHighlight: React.FC = () => {
  const features = [
    {
      icon: <Calendar size={24} />,
      title: "Intelligent Calendar",
      description: "Organize your schedule with our smart, adaptive calendar system."
    },
    {
      icon: <ListTodo size={24} />,
      title: "Task Management",
      description: "Prioritize your work with Eisenhower matrix and focused task lists."
    },
    {
      icon: <Clock size={24} />,
      title: "Time Tracking",
      description: "Understand where your time goes with intuitive tracking tools."
    },
    {
      icon: <Layout size={24} />,
      title: "Customizable Interface",
      description: "Adapt your workspace to match your unique workflow."
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={index} {...feature} />
      ))}
    </div>
  );
};

export default FeatureHighlight;
