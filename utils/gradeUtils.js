export const calculateCourseAverage = (assignments, gradingCriteria) => {
    if (!assignments || assignments.length === 0 || !gradingCriteria || gradingCriteria.length === 0) {
      return null;
    }
  
    let weightedSum = 0;
    let totalWeight = 0;
  
    gradingCriteria.forEach(criterion => {
      let categoryAssignments = assignments.filter(assignment =>
        assignment.title.toLowerCase().includes(criterion.category.toLowerCase()) 
      );
      if (categoryAssignments.length > 0) {
        let categoryWeightedSum = categoryAssignments.reduce((sum, assignment) => {
          return sum + (assignment.grade * assignment.weight / 100);
        }, 0);
        let categoryTotalWeight = categoryAssignments.reduce((sum, assignment) => sum + (assignment.weight / 100), 0);
  
        weightedSum += (categoryWeightedSum / categoryTotalWeight) * criterion.weight;
        totalWeight += criterion.weight;
      }
    });
  
    if (totalWeight === 0) {
      return null;
    }
  
    return weightedSum / totalWeight;
  };
  
  export const calculateGPA = async (courses, fetchAssignments, fetchGradingCriteria) => {
    if (!courses || courses.length === 0) {
      return null;
    }
  
    let totalWeightedAverage = 0;
    let totalCourses = courses.length;
  
    for (const course of courses) {
      const assignments = await fetchAssignments(course.id);
      const criteria = await fetchGradingCriteria(course.id);
      const courseAverage = calculateCourseAverage(assignments, criteria);
  
      if (courseAverage !== null) {
        totalWeightedAverage += courseAverage;
      } else {
        totalCourses--;
      }
    }
  
    if (totalCourses === 0) {
      return null;
    }
  
    const overallAverage = totalWeightedAverage / totalCourses;
  
    if (overallAverage >= 90) return 4.0;
    if (overallAverage >= 80) return 3.0;
    if (overallAverage >= 70) return 2.0;
    if (overallAverage >= 60) return 1.0;
    return 0.0;
  };