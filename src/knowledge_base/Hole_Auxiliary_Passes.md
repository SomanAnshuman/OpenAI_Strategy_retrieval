# Hole Auxiliary Cutting Passes
This file contains rules for Prepping, Centering, Countersinking/Counterboring, and Deburring.

# SECTION: PREPPING STRATEGIES

## Rule P1: Hole Prepping Strategy
**Rule ID:** P1
**Cutting Pass Type:** Hole Prepping
**Conditions:**
- Hole Type is Solid
- Surface Condition is Curved OR Surface Condition is Spline OR Surface Condition is Tapered
**Output Strategy:** Execute Hole Prepping Strategy P1
---

## Rule P2: Hole Prepping Strategy
**Rule ID:** P2
**Cutting Pass Type:** Hole Prepping
**Conditions:**
- Hole Type is Solid
- Surface Condition is Flat
**Output Strategy:** Execute Hole Prepping Strategy P2
---

## Rule P3: Hole Prepping Strategy
**Rule ID:** P3
**Cutting Pass Type:** Hole Prepping
**Conditions:**
- Hole Type is Hollow (Pre-drilled/Cast)
**Output Strategy:** Execute Hole Prepping Strategy P3
---

# SECTION: CENTERING STRATEGIES

## Rule C1: Centering Strategy
**Rule ID:** C1
**Cutting Pass Type:** Centering
**Conditions:**
- Hole Type is Solid
- Diameter between 3 mm and 25 mm
**Output Strategy:** Execute Centering Strategy C1
---

## Rule C2: Centering Strategy
**Rule ID:** C2
**Cutting Pass Type:** Centering
**Conditions:**
- Hole Type is Solid
- Diameter > 25 mm
**Output Strategy:** Execute Centering Strategy C2
---

# SECTION: COUNTERSINK & COUNTERBORE

## Rule CSCB1: Countersinking/Counterboring Strategy
**Rule ID:** CSCB1
**Cutting Pass Type:** Countersinking/Counterboring
**Conditions:**
- Counterbore Feature Required: YES
- Countersink Feature Required: YES
**Output Strategy:** Execute Countersinking/Counterboring Strategy CSCB1
---

## Rule CSCB2: Countersinking/Counterboring Strategy
**Rule ID:** CSCB2
**Cutting Pass Type:** Countersinking/Counterboring
**Conditions:**
- Counterbore Feature Required: YES
- Countersink Feature Required: NO
**Output Strategy:** Execute Countersinking/Counterboring Strategy CSCB2
---

## Rule CSCB3: Countersinking/Counterboring Strategy
**Rule ID:** CSCB3
**Cutting Pass Type:** Countersinking/Counterboring
**Conditions:**
- Counterbore Feature Required: NO
- Countersink Feature Required: YES
**Output Strategy:** Execute Countersinking/Counterboring Strategy CSCB3
---

## Rule CSCB4: Countersinking/Counterboring Strategy
**Rule ID:** CSCB4
**Cutting Pass Type:** Countersinking/Counterboring
**Conditions:**
- Counterbore Feature Required: NO
- Countersink Feature Required: NO
**Output Strategy:** Execute Countersinking/Counterboring Strategy CSCB4
---

# SECTION: DEBURRING STRATEGIES

## Rule D1: Deburring Strategy
**Rule ID:** D1
**Cutting Pass Type:** Deburring
**Conditions:**
- Deburring Operation Required: YES
**Output Strategy:** Execute Deburring Strategy D1
---

## Rule D2: Deburring Strategy
**Rule ID:** D2
**Cutting Pass Type:** Deburring
**Conditions:**
- Deburring Operation Required: NO
**Output Strategy:** Execute Deburring Strategy D2
---

