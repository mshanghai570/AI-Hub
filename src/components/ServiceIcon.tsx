import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Search, 
  Zap, 
  Brain, 
  Flame, 
  Cpu, 
  BookOpen, 
  Code, 
  MessageSquare, 
  Globe, 
  Terminal,
  Compass,
  Layers,
  Wand2
} from 'lucide-react';

interface ServiceIconProps {
  iconKey: string;
  className?: string;
  color?: string;
  size?: number;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ 
  iconKey, 
  className = 'w-4 h-4', 
  color,
  size = 18 
}) => {
  const iconProps = {
    className,
    size,
    style: color ? { color } : undefined
  };

  switch (iconKey.toLowerCase()) {
    case 'bot':
    case 'chatgpt':
      return <Bot {...iconProps} />;
    case 'sparkles':
    case 'claude':
      return <Sparkles {...iconProps} />;
    case 'gemini':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={className}
          style={color ? { color } : undefined}
        >
          <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
        </svg>
      );
    case 'search':
    case 'perplexity':
      return <Search {...iconProps} />;
    case 'zap':
    case 'grok':
      return <Zap {...iconProps} />;
    case 'brain':
    case 'deepseek':
      return <Brain {...iconProps} />;
    case 'flame':
    case 'mistral':
      return <Flame {...iconProps} />;
    case 'cpu':
    case 'copilot':
      return <Cpu {...iconProps} />;
    case 'book':
    case 'notebooklm':
      return <BookOpen {...iconProps} />;
    case 'code':
    case 'v0':
      return <Code {...iconProps} />;
    case 'message-square':
    case 'poe':
      return <MessageSquare {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    case 'terminal':
      return <Terminal {...iconProps} />;
    case 'compass':
      return <Compass {...iconProps} />;
    case 'wand':
      return <Wand2 {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
};
