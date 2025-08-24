#!/bin/bash
# Auto-confirm drizzle push with 'c' (create) for all questions
printf 'c\n%.0s' {1..50} | npm run db:push