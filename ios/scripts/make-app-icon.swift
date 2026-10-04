#!/usr/bin/env swift
//
//  make-app-icon.swift
//  AI Hub — iOS
//
//  Turns the master artwork in `ios/Artwork/app-icon-source.png` into the
//  1024x1024 PNG that `Assets.xcassets/AppIcon.appiconset` expects.
//
//  Usage:
//    swiftc -O ios/scripts/make-app-icon.swift -o /tmp/make-app-icon
//    /tmp/make-app-icon ios/Artwork/app-icon-source.png \
//                      ios/AIHub/Assets.xcassets/AppIcon.appiconset
//
//  Two things make this more than a resize:
//
//  1. The master art is a rounded square floating on a transparent field. iOS
//     applies its own corner mask (and, on iOS 26, its own shape), so shipping
//     the rounded corners would double-round them. We trim to the opaque bounds
//     so the art fills the full square edge to edge.
//
//  2. App icons must have no alpha channel — App Store validation rejects them
//     and iOS composites them against black, which darkens any soft edges. The
//     trim above re-exposes transparent corners, so we flatten the art over the
//     colour sampled from just inside its own top edge before writing.
//

import CoreGraphics
import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers

let outputSize = 1024

// MARK: - Loading

func loadImage(at path: String) -> CGImage {
    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        FileHandle.standardError.write("Could not read image at \(path)\n".data(using: .utf8)!)
        exit(1)
    }
    return image
}

/// Every pixel as straight (unpremultiplied) RGBA8, so alpha can be inspected
/// independently of colour.
func rgbaPixels(of image: CGImage) -> (data: [UInt8], width: Int, height: Int) {
    let width = image.width
    let height = image.height
    var data = [UInt8](repeating: 0, count: width * height * 4)
    data.withUnsafeMutableBytes { buffer in
        guard let context = CGContext(
            data: buffer.baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                | CGBitmapInfo.byteOrder32Big.rawValue
        ) else {
            FileHandle.standardError.write("Could not create inspection context\n".data(using: .utf8)!)
            exit(1)
        }
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    }
    return (data, width, height)
}

// MARK: - Analysis

/// Bounding box of pixels that are meaningfully opaque, in top-left origin
/// coordinates so it can be handed straight to `cropping(to:)`.
func opaqueBounds(_ image: CGImage, threshold: UInt8 = 24) -> CGRect {
    let (data, width, height) = rgbaPixels(of: image)
    var minX = width, minY = height, maxX = -1, maxY = -1

    for y in 0..<height {
        let row = y * width * 4
        for x in 0..<width where data[row + x * 4 + 3] > threshold {
            if x < minX { minX = x }
            if x > maxX { maxX = x }
            if y < minY { minY = y }
            if y > maxY { maxY = y }
        }
    }

    guard maxX >= minX, maxY >= minY else {
        FileHandle.standardError.write("Source image is fully transparent\n".data(using: .utf8)!)
        exit(1)
    }
    return CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
}

/// Average colour of an opaque strip just below the art's top edge — used as the
/// flat fill behind the re-exposed corners. Sampling beats a hard-coded colour:
/// the art is painterly, so its "black" is never actually #000000.
func edgeFillColour(_ image: CGImage, bounds: CGRect) -> CGColor {
    let (data, width, _) = rgbaPixels(of: image)
    let inset = 6
    let y = Int(bounds.minY) + inset
    let xStart = Int(bounds.midX) - Int(bounds.width * 0.25)
    let xEnd = Int(bounds.midX) + Int(bounds.width * 0.25)

    var r = 0, g = 0, b = 0, count = 0
    for x in xStart...xEnd {
        let index = (y * width + x) * 4
        guard data[index + 3] > 200 else { continue }
        r += Int(data[index]); g += Int(data[index + 1]); b += Int(data[index + 2])
        count += 1
    }
    guard count > 0 else { return CGColor(srgbRed: 0.04, green: 0.04, blue: 0.045, alpha: 1) }
    return CGColor(
        srgbRed: CGFloat(r / count) / 255,
        green: CGFloat(g / count) / 255,
        blue: CGFloat(b / count) / 255,
        alpha: 1
    )
}

// MARK: - Rendering

func flatten(_ image: CGImage, bounds: CGRect, fill: CGColor) -> CGImage {
    guard let cropped = image.cropping(to: bounds) else {
        FileHandle.standardError.write("Could not crop source image\n".data(using: .utf8)!)
        exit(1)
    }

    guard let context = CGContext(
        data: nil,
        width: outputSize,
        height: outputSize,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        // Opaque output: `noneSkipLast` writes no alpha channel at all.
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else {
        FileHandle.standardError.write("Could not create render context\n".data(using: .utf8)!)
        exit(1)
    }

    context.interpolationQuality = .high
    context.setFillColor(fill)
    context.fill(CGRect(x: 0, y: 0, width: outputSize, height: outputSize))
    context.draw(cropped, in: CGRect(x: 0, y: 0, width: outputSize, height: outputSize))

    guard let flattened = context.makeImage() else {
        FileHandle.standardError.write("Could not render flattened icon\n".data(using: .utf8)!)
        exit(1)
    }
    return flattened
}

func write(_ image: CGImage, to url: URL) {
    guard let destination = CGImageDestinationCreateWithURL(
        url as CFURL, UTType.png.identifier as CFString, 1, nil
    ) else {
        FileHandle.standardError.write("Could not create PNG destination at \(url.path)\n".data(using: .utf8)!)
        exit(1)
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        FileHandle.standardError.write("Could not write PNG at \(url.path)\n".data(using: .utf8)!)
        exit(1)
    }
    print("wrote \(url.path) (\(image.width)x\(image.height))")
}

// MARK: - Entry point

let arguments = CommandLine.arguments
guard arguments.count > 1 else {
    FileHandle.standardError.write("usage: make-app-icon <source.png> [output.appiconset]\n".data(using: .utf8)!)
    exit(1)
}

let sourcePath = arguments[1]
let outputDirectory = URL(fileURLWithPath: arguments.count > 2
    ? arguments[2]
    : "ios/AIHub/Assets.xcassets/AppIcon.appiconset")

let source = loadImage(at: sourcePath)
let bounds = opaqueBounds(source)
print("master art: \(source.width)x\(source.height), opaque bounds \(Int(bounds.width))x\(Int(bounds.height))")

try? FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let fill = edgeFillColour(source, bounds: bounds)
let icon = flatten(source, bounds: bounds, fill: fill)
write(icon, to: outputDirectory.appendingPathComponent("AppIcon-1024.png"))
