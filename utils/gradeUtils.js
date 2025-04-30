export const calculateCourseAverage = (assignments, gradingCriteria) => {
  // Validate inputs
  if (!Array.isArray(assignments) || !Array.isArray(gradingCriteria)) return null;
  
  if (assignments.length === 0) return null;

  // Calculate total weight to verify it sums to 100%
  const totalWeight = gradingCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    console.warn('Grading criteria weights do not sum to 100%');
    return null;
  }

  // Group assignments by category and calculate category averages
  const categoryResults = gradingCriteria.map(criterion => {
    const categoryAssignments = assignments.filter(a => a.category === criterion.category);
    
    if (categoryAssignments.length === 0) {
      return { weight: criterion.weight, average: null };
    }

    const totalPoints = categoryAssignments.reduce((sum, a) => sum + (a.grade || 0) * (a.weight || 0), 0);
    const totalWeight = categoryAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
    
    const weightedAverage = totalWeight > 0 ? totalPoints / totalWeight : 0;
    return { weight: criterion.weight, average: weightedAverage };
  });

  // Calculate overall weighted average
  let totalWeightedGrade = 0;
  let totalAppliedWeight = 0;

  categoryResults.forEach(({ weight, average }) => {
    if (average !== null) {
      totalWeightedGrade += average * (weight / 100);
      totalAppliedWeight += weight;
    }
  });

  if (totalAppliedWeight === 0) return null;

  const finalGrade = totalWeightedGrade * (100 / totalAppliedWeight);
  
  return Math.max(0, Math.min(100, finalGrade));
};


export const getLetterGrade = (grade) => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
};


export const getGradeColor = (grade) => {
  if (grade >= 90) return '#4CAF50';
  if (grade >= 80) return '#8BC34A';
  if (grade >= 70) return '#FFC107';
  if (grade >= 60) return '#FF9800';
  return '#F44336'; 
};