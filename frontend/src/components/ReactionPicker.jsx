import React from 'react';

const ReactionPicker = ({ isVisible, onReactionSelect, onMouseEnter, onMouseLeave }) => {
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Thích' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Buồn' },
    { type: 'angry', emoji: '😡', label: 'Giận dữ' }
  ];

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '20px',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '25px',
        padding: '8px 12px',
        display: 'flex',
        gap: '8px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'reactionPickerSlideUp 0.2s ease-out'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style>
        {`
          @keyframes reactionPickerSlideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      {reactionTypes.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => onReactionSelect(reaction.type)}
          title={reaction.label}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'none',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s ease',
            ':hover': {
              transform: 'scale(1.2)'
            }
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker; 