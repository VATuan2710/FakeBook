import React from "react";
import "./StorySection.css";

const StorySection = () => {
  const stories = [
    {
      name: "1",
      image:
        "https://fastly.picsum.photos/id/600/100/100.jpg?hmac=Gckao2idA78fRTxw8qskhil7_zitIFkkusvyw84KpOc",
    },
    {
      name: "2",
      image:
        "https://fastly.picsum.photos/id/600/100/100.jpg?hmac=Gckao2idA78fRTxw8qskhil7_zitIFkkusvyw84KpOc",
    },
    {
      name: "3",
      image:
        "https://fastly.picsum.photos/id/600/100/100.jpg?hmac=Gckao2idA78fRTxw8qskhil7_zitIFkkusvyw84KpOc",
    },
  ];

  return (
    <div className="storySection">
      {stories.map((story, index) => (
        <div key={index} className="story">
          <img src={story.image} alt={story.name} />
          <p>{story.name}</p>
        </div>
      ))}
    </div>
  );
};

export default StorySection;
