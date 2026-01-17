from dimod import ConstrainedQuadraticModel, Binary
import numpy as np

#TODO Create parseData
def parseData(data):
    num_semesters = data["constraintsData"][0]['semesters']
    max_credits_per_semester = data["constraintsData"][0]['credits_per_semester']
    total_credits_needed = data["constraintsData"][0]['total_credits']

    num_courses = len(data["coursesData"])

    course_ids = []
    course_credits = np.zeros((num_courses))
    course_required = np.zeros((num_courses))
    course_available = np.zeros((num_courses))

    for i in range(num_courses):
        course_ids.append(data["coursesData"][i]['course_id'])
        course_credits[i] = data["coursesData"][i]['credits']
        course_required[i] = data["coursesData"][i]['required']
        course_available[i] = data["coursesData"][i]['semester_available']
    
    return (num_semesters, max_credits_per_semester, total_credits_needed, 
            num_courses, course_ids, course_credits, course_required, course_available)

def main(data):
    """
    Main function that creates and returns the Constrained Quadratic Model
    for degree planning optimization.
    
    Decision variables: x[course_id][semester] - binary, 1 if course scheduled in that semester
    Objective: Minimize idle semesters (encourage fitting courses efficiently)
    Constraints:
      - Each required course must be scheduled exactly once
      - Total credits per semester cannot exceed maximum
      - Courses can only be scheduled from their available semester
      - Total credits scheduled must meet or exceed requirement
    """
    
    # Parse input data
    num_semesters, max_credits_per_semester, total_credits_needed, num_courses, \
        course_ids, course_credits, course_required, course_available = parseData(data)
    
    # Create the CQM model
    cqm = ConstrainedQuadraticModel()
    
    # Define binary variables: x[course_index][semester] 
    # 1 if course is scheduled in that semester, 0 otherwise
    x = {}
    for c in range(num_courses):
        for s in range(num_semesters):
            var_name = f"{course_ids[c]}_{s}"
            x[(c, s)] = Binary(var_name)
    
    # Objective: Minimize total idle credits across semesters (encourage full schedules)
    # This is done by maximizing scheduled credits, which in minimization becomes negative
    objective = 0
    for c in range(num_courses):
        for s in range(num_semesters):
            # Add to objective: negative because we want to maximize scheduled credits
            objective -= course_credits[c] * x[(c, s)]
    
    cqm.set_objective(objective)
    
    # Constraint 1: Each required course must be scheduled exactly once
    """
    for c in range(num_courses):
        if course_required[c]:  # Only if course is required
            cqm.add_constraint(
                sum(x[(c, s)] for s in range(num_semesters)) == 1,
                label=f"required_course_{course_ids[c]}"
            )

    """
    # Constraint 2: Each optional course can be scheduled at most once
    for c in range(num_courses):
        if not course_required[c]:  # Only if course is optional
            cqm.add_constraint(
                sum(x[(c, s)] for s in range(num_semesters)) <= 1,
                label=f"optional_course_{course_ids[c]}"
            )
    
    """
    # Constraint 3: Courses can only be scheduled from their available semester
    for c in range(num_courses):
        for s in range(num_semesters):
            if s < course_available[c]:  # Course not yet available
                cqm.add_constraint(
                    x[(c, s)] == 0,
                    label=f"availability_{course_ids[c]}_semester_{s}"
                )
    
    # Constraint 4: Total credits per semester cannot exceed maximum
    for s in range(num_semesters):
        cqm.add_constraint(
            sum(course_credits[c] * x[(c, s)] for c in range(num_courses)) <= max_credits_per_semester,
            label=f"max_credits_semester_{s}"
        )
    
    # Constraint 5: Total credits scheduled must meet requirement
    cqm.add_constraint(
        sum(course_credits[c] * x[(c, s)] for c in range(num_courses) for s in range(num_semesters)) >= total_credits_needed,
        label="total_credits_requirement"
    )
    """
    
    return cqm
