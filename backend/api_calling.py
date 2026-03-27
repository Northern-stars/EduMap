from openai import OpenAI


KEY=""

class api_access:
    def __init__(self,key=KEY,model="gpt-4.1"):
        self.client= OpenAI(api_key=key)
        self.model=model
    def read_file(self,path):
        with open(path, "rb") as f:
            file = f.read()

        response = self.client.responses.create(
            model=self.model,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Read through this file and conclude it"
                        },
                        {
                            "type": "input_file",
                            "filename": path,
                            "file_data": file
                        }
                    ]
                }
            ]
        )

        return response

    def read_text(self,text_list):
        response=self.client(
            model=self.model,
            input=[
                {"role":text_list[i][0],"content":text_list[i][1]} for i in range(len*text_list) 
            ]
        )
        return response


