if [[ $VERCEL_GIT_COMMIT_REF == "main" ]]; then
  npm run build
fi
