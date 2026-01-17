import image1 from "../images/diploma.jpg"
export default {
    //label under app icon
    label: "Quantum Degree", 
    //popup title
    title: "Quantum Degree", 
    //popup description
    description: "Software that utilizes quantum computing to generate degree plan",
    //popup media slides
    
    //ALLOWED TYPES - image, youtube
    media: [
        {type: "image", item: image1},
        {type: "youtube", item: "https://www.youtube.com/watch?v=L1H7Z6er3Go"},
    ],
    
    //required for submission, just leave as optimization
    category: "optimization"
};
