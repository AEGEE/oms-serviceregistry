if [ ! -f config.json ] 
then
  cp config.json.example config.json 
fi

npm install --silent
