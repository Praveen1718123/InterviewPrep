import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CandidateLayout } from "@/components/layouts/candidate-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, BookOpen, Code, Workflow } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Define skill categories and their related assessment question IDs
const skillCategories = {
  networking: {
    name: "Networking",
    description: "TCP/IP, OSI Model, Protocols, Routing",
    icon: <Workflow className="h-5 w-5" />,
    questionIds: ["net-mcq-1", "net-mcq-2", "net-mcq-3", "net-mcq-4", "net-mcq-5", "net-fib-1", "net-fib-2", "net-fib-3", "net-fib-5"],
    videoQuestionIds: ["net-vid-1", "net-vid-2", "net-vid-3"]
  },
  systemDesign: {
    name: "System Design",
    description: "Architecture, Scalability, Load Balancing",
    icon: <BookOpen className="h-5 w-5" />,
    questionIds: ["sys-mcq-1", "sys-mcq-2", "sys-fib-1"],
    videoQuestionIds: ["sys-vid-1"]
  },
  programming: {
    name: "Programming",
    description: "Algorithms, Data Structures, Problem Solving",
    icon: <Code className="h-5 w-5" />,
    questionIds: ["prog-mcq-1", "prog-fib-1", "prog-fib-2"],
    videoQuestionIds: ["prog-vid-1", "prog-vid-2"]
  }
};

// Define recommended resources for each skill
const resourcesBySkill = {
  networking: [
    { title: "Computer Networks: A Systems Approach", type: "Book", difficulty: "Advanced" },
    { title: "Introduction to TCP/IP", type: "Course", difficulty: "Beginner" },
    { title: "Network Troubleshooting Guide", type: "Article", difficulty: "Intermediate" }
  ],
  systemDesign: [
    { title: "System Design Interview", type: "Book", difficulty: "Intermediate" },
    { title: "Scalability Patterns", type: "Course", difficulty: "Advanced" }
  ],
  programming: [
    { title: "Data Structures and Algorithms", type: "Course", difficulty: "Intermediate" },
    { title: "Cracking the Coding Interview", type: "Book", difficulty: "Intermediate" }
  ]
};

export default function SkillAnalysis() {
  const { user } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  // Fetch completed assessments
  const { data: assessments, isLoading, error } = useQuery({
    queryKey: ["/api/candidate/assessments/completed"],
    enabled: !!user
  });
  
  // Calculate skill scores based on assessment results
  const calculateSkillScores = () => {
    if (!assessments || assessments.length === 0) {
      return [];
    }
    
    const skillScores: any = {};
    
    // Initialize skill scores
    Object.keys(skillCategories).forEach(skill => {
      skillScores[skill] = {
        name: skillCategories[skill as keyof typeof skillCategories].name,
        score: 0,
        questionCount: 0,
        correctCount: 0,
        strengths: [],
        weaknesses: []
      };
    });
    
    // Process MCQ assessments
    assessments.forEach((assessment: any) => {
      if (assessment.status !== "completed" && assessment.status !== "reviewed") return;
      
      if (assessment.responses) {
        assessment.responses.forEach((response: any) => {
          // Find which skill category this question belongs to
          for (const [skill, category] of Object.entries(skillCategories)) {
            if (category.questionIds.includes(response.questionId)) {
              const question = assessment.assessment.questions.find((q: any) => q.id === response.questionId);
              
              if (question) {
                skillScores[skill].questionCount++;
                
                // Check if the answer is correct
                if (assessment.assessment.type === "mcq") {
                  const isCorrect = response.selectedOptionId === question.correctOptionId;
                  if (isCorrect) {
                    skillScores[skill].correctCount++;
                    skillScores[skill].strengths.push(question.text);
                  } else {
                    skillScores[skill].weaknesses.push(question.text);
                  }
                } else if (assessment.assessment.type === "fill-in-blanks") {
                  // For fill-in-blanks, check each blank
                  let blankCorrect = false;
                  
                  if (question.blanks && response.answers) {
                    for (const blank of question.blanks) {
                      const userAnswer = response.answers[blank.id];
                      if (userAnswer && userAnswer.toLowerCase() === blank.correctAnswer.toLowerCase()) {
                        blankCorrect = true;
                      } else {
                        blankCorrect = false;
                        break;
                      }
                    }
                  }
                  
                  if (blankCorrect) {
                    skillScores[skill].correctCount++;
                    skillScores[skill].strengths.push(question.text);
                  } else {
                    skillScores[skill].weaknesses.push(question.text);
                  }
                }
              }
              
              break;
            }
          }
        });
      }
    });
    
    // Calculate scores as percentages
    Object.keys(skillScores).forEach(skill => {
      if (skillScores[skill].questionCount > 0) {
        skillScores[skill].score = Math.round((skillScores[skill].correctCount / skillScores[skill].questionCount) * 100);
      }
    });
    
    // Convert to array format for charts
    return Object.keys(skillScores).map(skill => ({
      skill: skillScores[skill].name,
      score: skillScores[skill].score,
      strengths: skillScores[skill].strengths.slice(0, 3), // Limit to top 3
      weaknesses: skillScores[skill].weaknesses.slice(0, 3), // Limit to top 3
      skillKey: skill
    }));
  };
  
  const skillScores = calculateSkillScores();
  
  // Format data for different chart types
  const radarData = skillScores.map(item => ({
    skill: item.skill,
    score: item.score
  }));
  
  const barChartData = skillScores.map(item => ({
    skill: item.skill,
    score: item.score,
    benchmark: 70 // Industry benchmark (example)
  }));
  
  // Calculate improvement areas (skills with the largest gaps)
  const improvementAreas = [...skillScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2); // Top 2 weakest skills
  
  // Calculate progress timeline (simulated for now)
  const progressData = [
    { month: "Jan", score: 40 },
    { month: "Feb", score: 50 },
    { month: "Mar", score: 65 },
    { month: "Apr", score: skillScores.reduce((acc, item) => acc + item.score, 0) / skillScores.length || 0 }
  ];
  
  const handleSkillSelect = (skillKey: string) => {
    setSelectedSkill(skillKey);
  };
  
  const getSkillResources = (skillKey: string) => {
    return resourcesBySkill[skillKey as keyof typeof resourcesBySkill] || [];
  };
  
  if (isLoading) {
    return (
      <CandidateLayout title="Skill Gap Analysis">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CandidateLayout>
    );
  }
  
  if (error || !assessments || assessments.length === 0) {
    return (
      <CandidateLayout title="Skill Gap Analysis">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium">No Assessment Data Available</h3>
          <p className="text-gray-600 mt-2">
            Complete some assessments to see your skill analysis.
          </p>
        </div>
      </CandidateLayout>
    );
  }
  
  return (
    <CandidateLayout title="Skill Gap Analysis">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Interactive Skill Analysis</h1>
          <p className="text-gray-600">
            Visualize your strengths and areas for improvement based on your assessment results.
          </p>
        </div>
        
        <Tabs defaultValue="radar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="radar">Skill Radar</TabsTrigger>
            <TabsTrigger value="progress">Progress Timeline</TabsTrigger>
            <TabsTrigger value="comparison">Benchmark Comparison</TabsTrigger>
          </TabsList>
          
          {/* Radar Chart View */}
          <TabsContent value="radar">
            <Card>
              <CardHeader>
                <CardTitle>Your Skill Radar</CardTitle>
                <CardDescription>
                  This radar chart shows your performance across different skill categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.5}
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {skillScores.map((skill) => (
                    <Card 
                      key={skill.skill} 
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedSkill === skill.skillKey ? 'border-2 border-primary' : ''
                      }`}
                      onClick={() => handleSkillSelect(skill.skillKey)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {skillCategories[skill.skillKey as keyof typeof skillCategories].icon}
                            <h3 className="font-medium ml-2">{skill.skill}</h3>
                          </div>
                          <Badge 
                            variant={skill.score >= 80 ? "default" : skill.score >= 60 ? "secondary" : "outline"}
                          >
                            {skill.score}%
                          </Badge>
                        </div>
                        <Progress value={skill.score} className="h-2" />
                        <p className="text-sm text-gray-500 mt-2">
                          {skillCategories[skill.skillKey as keyof typeof skillCategories].description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Progress Timeline */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>
                  Track your skill improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Average Skill Score"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Benchmark Comparison */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Industry Benchmark Comparison</CardTitle>
                <CardDescription>
                  See how your skills compare to industry standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="score" name="Your Score" fill="#8884d8" />
                      <Bar dataKey="benchmark" name="Industry Benchmark" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Skill Details and Recommendations */}
        {selectedSkill && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    <div className="flex items-center">
                      {skillCategories[selectedSkill as keyof typeof skillCategories].icon}
                      <span className="ml-2">
                        {skillCategories[selectedSkill as keyof typeof skillCategories].name} Details
                      </span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis and personalized recommendations
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedSkill(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths and Weaknesses */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Assessment Results</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                    <ul className="space-y-2">
                      {skillScores.find(s => s.skillKey === selectedSkill)?.strengths.map((item, idx) => (
                        <li key={idx} className="text-sm bg-green-50 p-2 rounded-md flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {item}
                        </li>
                      ))}
                      {skillScores.find(s => s.skillKey === selectedSkill)?.strengths.length === 0 && (
                        <li className="text-sm text-gray-500 italic">
                          No specific strengths identified yet
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-2">
                      {skillScores.find(s => s.skillKey === selectedSkill)?.weaknesses.map((item, idx) => (
                        <li key={idx} className="text-sm bg-red-50 p-2 rounded-md flex items-start">
                          <span className="text-red-500 mr-2">!</span>
                          {item}
                        </li>
                      ))}
                      {skillScores.find(s => s.skillKey === selectedSkill)?.weaknesses.length === 0 && (
                        <li className="text-sm text-gray-500 italic">
                          No specific weaknesses identified yet
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {/* Recommended Resources */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Recommended Resources</h3>
                  <div className="space-y-3">
                    {getSkillResources(selectedSkill).map((resource, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-md">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{resource.title}</h4>
                          <Badge variant="outline">{resource.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Difficulty: {resource.difficulty}
                        </p>
                      </div>
                    ))}
                    <div className="pt-3">
                      <Button className="w-full">
                        View All Resources
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Improvement Plan */}
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Personalized Improvement Plan
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Based on your assessment results, we recommend focusing on these key areas:
                </p>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium">Short-term Goals (1-2 weeks)</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Review fundamentals of {skillCategories[selectedSkill as keyof typeof skillCategories].name}</li>
                      <li>• Complete practice exercises on areas of weakness</li>
                      <li>• Re-take assessment to measure improvement</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium">Long-term Goals (1-3 months)</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Deep dive into advanced topics</li>
                      <li>• Work on practical projects to apply knowledge</li>
                      <li>• Aim for at least 80% proficiency in this skill area</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Improvement Areas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Priority Improvement Areas</CardTitle>
            <CardDescription>
              Focus on these skills to maximize your interview readiness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {improvementAreas.map((area) => (
                <Card key={area.skill} className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {area.skill}
                      <Badge className="ml-2" variant="outline">{area.score}%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      This skill requires improvement to meet industry standards.
                    </p>
                    
                    <Button onClick={() => handleSkillSelect(area.skillKey)} className="w-full">
                      View Detailed Analysis
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
}