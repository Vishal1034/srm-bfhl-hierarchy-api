# SRM Full Stack Engineering Challenge Solution

This is my solution for the SRM Round 1 Full Stack challenge.

It includes:
1. A backend API endpoint at POST /bfhl
2. A frontend page where you can paste node relationships and view the API response

## What this project does

The API accepts an array of node strings like A->B and returns:
1. My identity fields (user_id, email_id, roll number)
2. Processed hierarchies
3. Invalid entries
4. Duplicate edges
5. Summary data for trees and cycles

The frontend is a single page that lets you test the endpoint quickly.

## Tech stack

1. Node.js
2. Express
3. Vanilla HTML, CSS, and JavaScript

## Run locally

1. Install dependencies

   npm install

2. Make sure a .env file exists in the root with these values:
   FULL_NAME
   DOB_DDMMYYYY
   EMAIL_ID
   COLLEGE_ROLL_NUMBER

3. Start the server

   npm start

4. Open in browser
   Frontend: http://localhost:3000
   Health check: http://localhost:3000/health

## API details

Endpoint:
POST /bfhl

Request body example:

{
  "data": ["A->B", "A->C", "B->D"]
}

Main response fields:
1. user_id
2. email_id
3. college_roll_number
4. hierarchies
5. invalid_entries
6. duplicate_edges
7. summary

## Rules handled in code

1. Valid format must be X->Y with uppercase single-letter nodes
2. Self-loops like A->A are treated as invalid
3. Duplicate edges are tracked once after first occurrence
4. Multi-parent conflicts keep the first valid parent only
5. Cyclic groups return has_cycle true and empty tree object
6. Non-cyclic groups return nested tree and depth
7. Largest tree root follows depth first, then lexicographic tie-break

## Submission checklist

1. Hosted backend URL with /bfhl route
2. Hosted frontend URL
3. Public GitHub repository URL
