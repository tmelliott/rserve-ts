import _ from "underscore";
import _is_little_endian from "./endian";

type Constructor<T> = {
  new (buffer: ArrayBuffer, offset?: number, length?: number): T;
  BYTES_PER_ELEMENT?: number;
};

export const my_ArrayBufferView = (b: ArrayBuffer, o?: number, l?: number) => {
  console.log("ARGS: ", b, o, l);
  const buffer = b;
  const offset = o ?? 0;
  const length = l ?? b.byteLength;
  console.log("BUFFER: ", buffer, "OFFSET: ", offset, "LENGTH: ", length);

  return {
    buffer,
    offset,
    length,
    data_view: () => {
      return new EndianAwareDataView(
        buffer,
        offset,
        buffer.byteLength - offset
      );
    },
    make: <T extends DataView | ArrayBuffer | EndianAwareDataView>(
      ctor: Constructor<T>,
      new_offset?: number,
      new_length?: number
    ): T => {
      new_offset = new_offset ?? 0;
      new_length = new_length ?? length;
      const element_size = ctor.BYTES_PER_ELEMENT ?? 1;
      const n_els = new_length / element_size;

      console.log("MAKE- BUFFER: ", buffer);

      if ((offset + new_offset) % element_size !== 0) {
        const view = new DataView(buffer, offset + new_offset, new_length);
        console.log("VIEW: ", view);
        const output_buffer = new ArrayBuffer(new_length);
        const out_view = new DataView(output_buffer);
        for (let i = 0; i < new_length; i++) {
          out_view.setUint8(i, view.getUint8(i));
        }
        return new ctor(output_buffer);
      } else {
        console.log(
          "ctor: ",
          ctor,
          "; offset: ",
          offset,
          "; new_offset: ",
          new_offset,
          "; n_els: ",
          n_els
        );
        return new ctor(buffer, offset + new_offset, n_els);
      }
    },
    skip: (o: number) => {
      return my_ArrayBufferView(buffer, offset + o, buffer.byteLength);
    },
    view: (new_offset: number, new_length: number) => {
      var ofs = offset + new_offset;
      if (ofs + new_length > buffer.byteLength) {
        throw new Error(
          "my_ArrayBufferView.view: bounds error: size: " +
            buffer.byteLength +
            " offset: " +
            ofs +
            " length: " +
            new_length
        );
      }
      return my_ArrayBufferView(buffer, ofs, new_length);
    },
  };
};

export type my_ArrayBufferView = ReturnType<typeof my_ArrayBufferView>;

export class EndianAwareDataView {
  view: DataView;

  constructor(buffer: ArrayBuffer, byteOffset?: number, byteLength?: number) {
    this.view = new DataView(buffer, byteOffset, byteLength);
  }

  setInt8 = (i: number, v: number) => {
    this.view.setInt8(i, v);
  };
  getInt8 = (i: number) => {
    return this.view.getInt8(i);
  };

  setUint8 = (i: number, v: number) => {
    this.view.setUint8(i, v);
  };
  getUint8 = (i: number) => {
    return this.view.getUint8(i);
  };

  setInt32 = (i: number, v: number) => {
    this.view.setInt32(i, v, _is_little_endian);
  };
  setInt16 = (i: number, v: number) => {
    this.view.setInt16(i, v, _is_little_endian);
  };
  setUint32 = (i: number, v: number) => {
    this.view.setUint32(i, v, _is_little_endian);
  };
  setUint16 = (i: number, v: number) => {
    this.view.setUint16(i, v, _is_little_endian);
  };
  setFloat32 = (i: number, v: number) => {
    this.view.setFloat32(i, v, _is_little_endian);
  };
  setFloat64 = (i: number, v: number) => {
    this.view.setFloat64(i, v, _is_little_endian);
  };

  getInt32 = (i: number) => this.view.getInt32(i, _is_little_endian);
  getInt16 = (i: number) => this.view.getInt16(i, _is_little_endian);
  getUint32 = (i: number) => this.view.getUint32(i, _is_little_endian);
  getUint16 = (i: number) => this.view.getUint16(i, _is_little_endian);
  getFloat32 = (i: number) => this.view.getFloat32(i, _is_little_endian);
  getFloat64 = (i: number) => this.view.getFloat64(i, _is_little_endian);
}

export type EndianDataView = InstanceType<typeof EndianAwareDataView>;
