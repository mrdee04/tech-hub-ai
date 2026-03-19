/**
 * AI Service for summarizing tech news and analyzing product reviews.
 * Uses Gemini API (Placeholder for now).
 */

export const summarizeArticle = async (content: string): Promise<string> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock summary logic (In a real app, this would call Gemini)
  if (content.length < 50) return content;
  return content.substring(0, 150) + "... [AI Summary]";
};

export const analyzeSentiment = async (reviews: string[]): Promise<{ score: number; topReview: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    score: 4.8,
    topReview: reviews[0] || "Đánh giá tuyệt vời!"
  };
};
