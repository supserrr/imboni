#!/bin/bash
set -e

# Install MeloTTS from GitHub with proper requirements.txt
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Clone MeloTTS repository
git clone https://github.com/myshell-ai/MeloTTS.git
cd MeloTTS

# Create requirements.txt with all dependencies
cat > requirements.txt << 'EOF'
txtsplit
cached_path
num2words==0.5.12
unidic==1.1.0
unidic_lite==1.0.8
mecab-python3==1.0.9
pykakasi==2.2.1
fugashi>=1.3.0
g2p_en==2.1.0
anyascii==0.3.2
jamo==0.4.1
gruut[de,es,fr]==2.2.3
g2pkk>=0.1.1
librosa==0.9.1
pydub==0.25.1
eng_to_ipa==0.0.2
inflect==7.0.0
unidecode==1.3.7
pypinyin==0.50.0
cn2an==0.5.22
jieba==0.42.1
gradio
langid==1.1.6
tensorboard==2.16.2
loguru==0.7.2
EOF

# Install MeloTTS (dependencies already installed via python_packages)
pip install --no-deps -e .

# Clean up
cd /
rm -rf "$TMP_DIR"

# Download unidic data
python -m unidic download

