#!/bin/bash
# Script to complete drizzle database push by automatically answering prompts

cd /home/runner/workspace

# Function to send responses to drizzle prompts
{
  sleep 2
  echo "c"  # Create table for departments
  sleep 1
  echo "c"  # Create table for organizations  
  sleep 1
  echo "c"  # Create table for family_groups
  sleep 1
  echo "c"  # Create table for user_permissions
  sleep 1
  echo "y"  # Confirm all changes
  sleep 1
} | npx drizzle-kit push