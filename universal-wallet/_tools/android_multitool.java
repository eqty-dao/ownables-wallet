// A utility script to assist in creating and managing Android projects.
// Written in Java so that no other dependancies are required
// Author: Jason Soo

import java.util.Arrays;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.geom.Ellipse2D;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.File;

public class android_multitool {
  private static String USAGE_HELP = "Usage: java android_multitool <tool> <tool_options>\nWhere tools and options:\n"
      +
      // Image resize tool help
      "  resize_image <input.png> <output.size> <new_width>\n    Tool to resize image files\n\n" +
      // Splash resize tool help
      "  resize_splash <input.png> <output> <image_width> <image_height> <rrggbb> [square.zie] \n    Tool to resize splash image files\n\n [square.size] as optional parameter to set square size."
      +
      // multiline replace tool help
      "  replace <filename>\n    Tool to perform a multiline search and replace in a file.\n" +
      "    You must export environment variables SEARCH and REPLACE before running command\n\n";

  public static void main(String[] args) throws IOException {
    if (args.length == 0) {
      System.out.print(USAGE_HELP);
      System.exit(-1);
    }

    String toolName = args[0];
    String[] toolOptions = Arrays.copyOfRange(args, 1, args.length);
    // System.out.printf("%d %d\n", args.length, toolOptions.length);

    switch (toolName) {
      case "resize_image":
        image_resizer(toolOptions);
        return;
      case "replace":
        multiline_replace(toolOptions);
        return;
      case "resize_splash":
        splash_resizer(toolOptions);
        return;
    }
  }

  public static void splash_resizer(String[] args) throws IOException {

    if (args.length < 4 || args.length > 6) {
      System.out.print(
          "Usage: java splash_resizer <input.png> <target.png> <canvas.width> <canvas.height> <rrggbb> [square.size]\n");
      System.exit(-1);
    }

    Path source = Paths.get(args[0]);
    Path target = Paths.get(args[1]);
    int canvas_width = Integer.parseInt(args[2]);
    int canvas_height = Integer.parseInt(args[3]);
    String bgColor = args[4].toString();
    boolean isSquare = args.length == 6 && args[5] != null;
    int squareSize = 0;

    if (isSquare) {
      squareSize = Integer.parseInt(args[5]);
    }

    System.out.printf("Generating splash %d x %d\n", canvas_width, canvas_height);

    BufferedImage image = new BufferedImage(canvas_width, canvas_height, BufferedImage.TYPE_INT_RGB);

    Graphics2D g = image.createGraphics();

    Color backgroundColor = hex2Rgb(bgColor);
    g.setPaint(backgroundColor);
    g.fillRect(0, 0, canvas_width, canvas_height);

    Image _image = ImageIO.read(source.toFile());

    int imgWidth = _image.getWidth(null);
    int imgHeight = _image.getHeight(null);

    Dimension imgSize = new Dimension(imgWidth, imgHeight);
    Dimension boundary = new Dimension(canvas_width, canvas_height);

    Dimension data = getScaledDimension(imgSize, boundary);

    // Add extra arg to allow squarish image and if its bigger than canvas width,
    // fit to the canvas width, otherway fit to the square size centered

    int xImg = (canvas_width / 2) - (data.width / 2);
    int yImg = (canvas_height / 2) - (data.height / 2);

    // Check if its square image and reduce the size
    if (isSquare) {

      if (squareSize > canvas_width) {
        g.drawImage(_image, xImg, yImg, canvas_width, data.height, null, null);
      } else {
        g.drawImage(_image, (canvas_width / 2) - (squareSize / 2), (canvas_height / 2) - (squareSize / 2),
            squareSize, squareSize, null, null);
      }

    } else {
      g.drawImage(_image, xImg, yImg, data.width, data.height, null, null);
    }

    String s = target.getFileName().toString();
    String fileExtension = s.substring(s.lastIndexOf(".") + 1);

    ImageIO.write(image, fileExtension, target.toFile());
  }

  public static Color hex2Rgb(String colorStr) {
    return new Color(Integer.valueOf(colorStr, 16));
  }

  static Dimension getScaledDimension(Dimension imageSize, Dimension boundary) {

    double widthRatio = boundary.getWidth() / imageSize.getWidth();
    double heightRatio = boundary.getHeight() / imageSize.getHeight();
    double ratio = Math.min(widthRatio, heightRatio);

    return new Dimension((int) (imageSize.width * ratio),
        (int) (imageSize.height * ratio));
  }

  // >>>>> image resize tool
  // import javax.imageio.ImageIO;
  // import java.awt.*;
  // import java.awt.image.BufferedImage;
  // import java.awt.geom.Ellipse2D
  // import java.io.FileInputStream;
  // import java.io.IOException;
  // import java.io.InputStream;
  // import java.nio.file.Path;
  // import java.nio.file.Paths;
  public static void image_resizer(String[] args) throws IOException {

    if (args.length < 3 || args.length > 4) {
      System.out.print("Usage: java resize_image <input.png> <output.size> <new_width> [round]\n");
      System.exit(-1);
    }

    Path source = Paths.get(args[0]);
    Path target = Paths.get(args[1]);
    int new_width = Integer.parseInt(args[2]);
    boolean isRound = args.length == 4 && args[3].equals("round");

    try (InputStream is = new FileInputStream(source.toFile())) {
      resize(is, target, new_width, isRound);
    }

  }

  private static void resize(InputStream input, Path target,
      int newWidth, boolean isRound) throws IOException {

    BufferedImage originalImage = ImageIO.read(input);

    // Scale height to new width
    int newHeight = newWidth * originalImage.getHeight() / originalImage.getWidth();

    System.out.printf("Original %d x %d => New %d x %d %s\n", originalImage.getWidth(), originalImage.getHeight(),
        newWidth, newHeight, isRound ? "round" : "");

    /**
     * SCALE_AREA_AVERAGING
     * SCALE_DEFAULT
     * SCALE_FAST
     * SCALE_REPLICATE
     * SCALE_SMOOTH
     */
    Image newResizedImage = originalImage
        .getScaledInstance(newWidth, newHeight, Image.SCALE_SMOOTH);
    BufferedImage bim = convertToBufferedImage(newResizedImage, isRound);

    String s = target.getFileName().toString();
    String fileExtension = s.substring(s.lastIndexOf(".") + 1);

    // we want image in png format
    ImageIO.write(bim, fileExtension, target.toFile());

  }

  public static BufferedImage convertToBufferedImage(Image img, boolean isRound) {

    if (img instanceof BufferedImage) {
      return (BufferedImage) img;
    }
    int imgWidth = img.getWidth(null);
    int imgHeight = img.getHeight(null);

    // Create a buffered image with transparency
    BufferedImage bi = new BufferedImage(imgWidth, imgHeight, BufferedImage.TYPE_INT_ARGB);

    Graphics2D graphics2D = bi.createGraphics();
    if (isRound)
      graphics2D.setClip(new Ellipse2D.Double(0, 0, imgWidth, imgHeight));

    graphics2D.drawImage(img, 0, 0, null);
    graphics2D.dispose();

    return bi;
  }

  // >>>>> multi line search and replace tool
  // import java.io.BufferedReader;
  // import java.io.BufferedWriter;
  // import java.io.FileReader;
  // import java.io.FileWriter;
  // import java.io.IOException;

  public static void multiline_replace(String[] args) {
    if (args.length != 1) {
      System.out.println("need file name");
      System.exit(-1);
      return;
    }

    String searchString = System.getenv("SEARCH");
    String replaceString = System.getenv("REPLACE");

    String filePath = args[0];

    System.out.printf("Updating file: %s\n", filePath);

    String content = readFileToString(filePath);
    // FOR DEBUG System.out.printf("%s\n", content);
    String newContent = content.replace(searchString, replaceString);
    writeStringToFile(filePath, newContent);
  }

  private static String readFileToString(String filePath) {
    StringBuilder contentBuilder = new StringBuilder();
    try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
      String sCurrentLine;
      while ((sCurrentLine = br.readLine()) != null) {
        contentBuilder.append(sCurrentLine).append("\n");
      }
    } catch (IOException e) {
      return "";
    }
    return contentBuilder.toString();
  }

  private static boolean writeStringToFile(String filePath, String content) {
    try {
      BufferedWriter writer = new BufferedWriter(new FileWriter(filePath));
      writer.write(content);
      writer.close();
      return true;
    } catch (IOException e) {
    }
    return false;
  }

}