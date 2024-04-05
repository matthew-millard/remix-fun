export async function convertFileToBuffer(file: File) {
	const fileBuffer = await file.arrayBuffer(); // Convert the uploaded file to ArrayBuffer
	return Buffer.from(fileBuffer); // Convert ArrayBuffer to Buffer
}
