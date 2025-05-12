import gradio as gr
from PIL import Image
from ultralytics import YOLO
import torchvision.transforms.functional as TVF
from transformers import Owlv2VisionModel
from torch import nn
import torch
import torch.nn.functional as F


# OWLv2 classification head
class DetectorModelOwl(nn.Module):
	owl: Owlv2VisionModel

	def __init__(self, model_path: str, dropout: float, n_hidden: int = 768):
		super().__init__()

		owl = Owlv2VisionModel.from_pretrained(model_path)
		assert isinstance(owl, Owlv2VisionModel)
		self.owl = owl
		self.owl.requires_grad_(False)
		self.transforms = None

		self.dropout1 = nn.Dropout(dropout)
		self.ln1 = nn.LayerNorm(n_hidden, eps=1e-5)
		self.linear1 = nn.Linear(n_hidden, n_hidden * 2)
		self.act1 = nn.GELU()
		self.dropout2 = nn.Dropout(dropout)
		self.ln2 = nn.LayerNorm(n_hidden * 2, eps=1e-5)
		self.linear2 = nn.Linear(n_hidden * 2, 2)
	
	def forward(self, pixel_values: torch.Tensor, labels: torch.Tensor | None = None):
		with torch.autocast("cpu", dtype=torch.bfloat16):
			outputs = self.owl(pixel_values=pixel_values, output_hidden_states=True)
			x = outputs.last_hidden_state  # B, N, C
		
			x = self.dropout1(x)
			x = self.ln1(x)
			x = self.linear1(x)
			x = self.act1(x)
			x = self.dropout2(x)
			x, _ = x.max(dim=1)
			x = self.ln2(x)
			x = self.linear2(x)
		
		if labels is not None:
			loss = F.cross_entropy(x, labels)
			return (x, loss)

		return (x,)


def owl_predict(image: Image.Image) -> bool:
	big_side = max(image.size)
	new_image = Image.new("RGB", (big_side, big_side), (128, 128, 128))
	new_image.paste(image, (0, 0))
	preped = new_image.resize((960, 960), Image.BICUBIC)
	preped = TVF.pil_to_tensor(preped)
	preped = preped / 255.0
	input_image = TVF.normalize(preped, [0.48145466, 0.4578275, 0.40821073], [0.26862954, 0.26130258, 0.27577711])
	logits, = model(input_image.to('cpu').unsqueeze(0), None)
	probs = F.softmax(logits, dim=1)
	prediction = torch.argmax(probs.cpu(), dim=1)
	return prediction.item() == 1


def yolo_predict(image: Image.Image) -> Image.Image:
	results = yolo_model(image, imgsz=1024, augment=True, iou=0.5)
	assert len(results) == 1
	result = results[0]
	im_array = result.plot()
	im = Image.fromarray(im_array[..., ::-1])
	return im


def predict(image: Image.Image, conf_threshold: float):
	owl_prediction = owl_predict(image)
	label_owl = "Watermarked" if owl_prediction else "Not Watermarked"
	yolo_image = yolo_predict(image)
	return yolo_image, f"OWLv2 Prediction: {label_owl}"


# Load OWLv2 classification model
model = DetectorModelOwl("google/owlv2-base-patch16-ensemble", dropout=0.0)
model.load_state_dict(torch.load("far5y1y5-8000.pt", map_location="cpu"))
model.eval()

# Load YOLO model
yolo_model = YOLO("yolo11x-train28-best.pt")


# Define Gradio app (but don't launch)
gradio_app = gr.Blocks()
with gradio_app:
	gr.HTML("<h1>Watermark Detection</h1>")

	with gr.Row():
		with gr.Column():
			image = gr.Image(type="pil", label="Image")
			conf_threshold = gr.Slider(minimum=0.0, maximum=1.0, value=0.5, label="Confidence Threshold")
			btn_submit = gr.Button(value="Detect Watermarks")
		
		with gr.Column():
			image_yolo = gr.Image(type="pil", label="YOLO Detections")
			label_owl = gr.Label(label="OWLv2 Prediction: N/A")
		
	btn_submit.click(fn=predict, inputs=[image, conf_threshold], outputs=[image_yolo, label_owl])


# Optional: Run only if called directly
if __name__ == "__main__":
	gradio_app.launch()
